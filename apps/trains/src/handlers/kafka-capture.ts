import type { Context } from "aws-lambda";
import { InvokeCommand } from "@aws-sdk/client-lambda";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { gzipSync } from "node:zlib";

import { lambda, s3 } from "../lib/aws.js";
import { parseKafkaValue, rid, serviceDate, uid } from "../lib/darwin.js";
import { requiredEnv } from "../lib/env.js";

const bucketName = requiredEnv("RAW_BUCKET_NAME");
const kafkaTopic = requiredEnv("KAFKA_TOPIC");
const processorFunctionName = requiredEnv("PROCESSOR_FUNCTION_NAME");

export type KafkaRecord = {
  topic: string;
  partition: number;
  offset: number;
  timestamp: number;
  timestampType: string;
  key?: string | null;
  value?: string | null;
  headers?: Array<Record<string, number[]>>;
};

export type KafkaEvent = {
  eventSource: "aws:kafka";
  records: Record<string, KafkaRecord[]>;
};

type RawBatchHandoff = {
  bucketName: string;
  objectKey: string;
  records: number;
};

function decodeRecordValue(record: KafkaRecord): string | undefined {
  if (!record.value) {
    return undefined;
  }

  return Buffer.from(record.value, "base64").toString("utf8");
}

async function storeRawBatch(
  lines: unknown[],
  context: Context,
): Promise<RawBatchHandoff | undefined> {
  if (lines.length === 0) return undefined;
  const now = new Date();
  const yyyy = now.toISOString().slice(0, 10);
  const key = `raw/topic=${encodeURIComponent(kafkaTopic)}/ingest_date=${yyyy}/${context.awsRequestId}.ndjson.gz`;
  const ndjson = lines.map((line) => JSON.stringify(line)).join("\n") + "\n";

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: gzipSync(Buffer.from(ndjson, "utf8")),
      ContentEncoding: "gzip",
      ContentType: "application/x-ndjson",
    }),
  );

  return { bucketName, objectKey: key, records: lines.length };
}

async function invokeProcessor(handoff: RawBatchHandoff): Promise<void> {
  await lambda.send(
    new InvokeCommand({
      FunctionName: processorFunctionName,
      InvocationType: "Event",
      Payload: Buffer.from(JSON.stringify(handoff)),
    }),
  );
}

function capturedLine(topicPartition: string, record: KafkaRecord): unknown | undefined {
  const rawValue = decodeRecordValue(record);
  if (!rawValue) {
    return undefined;
  }

  try {
    const parsed = parseKafkaValue(rawValue);
    return {
      topicPartition,
      topic: record.topic,
      partition: record.partition,
      offset: record.offset,
      timestamp: record.timestamp,
      messageId: parsed.messageId,
      sequence: parsed.sequence,
      rid: parsed.update ? rid(parsed.update) : undefined,
      uid: parsed.update ? uid(parsed.update) : undefined,
      serviceDate: parsed.update ? serviceDate(parsed.update) : undefined,
      value: parsed.envelope,
    };
  } catch (error) {
    return {
      topicPartition,
      topic: record.topic,
      partition: record.partition,
      offset: record.offset,
      timestamp: record.timestamp,
      parseError: error instanceof Error ? error.message : String(error),
      rawValue,
    };
  }
}

export async function handler(
  event: KafkaEvent,
  context: Context,
): Promise<{ records: number; captured: boolean }> {
  const rawLines: unknown[] = [];
  for (const [topicPartition, records] of Object.entries(event.records ?? {})) {
    for (const record of records) {
      const line = capturedLine(topicPartition, record);
      if (line) {
        rawLines.push(line);
      }
    }
  }

  const handoff = await storeRawBatch(rawLines, context);

  if (handoff) {
    await invokeProcessor(handoff);
  }

  return { records: rawLines.length, captured: Boolean(handoff) };
}
