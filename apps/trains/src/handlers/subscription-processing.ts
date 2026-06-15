import { GetObjectCommand } from "@aws-sdk/client-s3";
import {
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { gunzipSync } from "node:zlib";

import { ddb, s3 } from "../lib/aws.js";
import {
  defaultNotificationsListener,
  defaultNotificationsListenerId,
} from "../lib/default-listener.js";
import {
  actualArrivalAt,
  estimatedArrivalAt,
  isSameTimeWindow,
  locations,
  parseKafkaEnvelope,
  plannedDepartureAt,
  rid,
  serviceDate,
  uid,
  uniqueTpls,
  type DarwinLocation,
  type DarwinUpdate,
  type KafkaEnvelope,
  type ParsedKafkaMessage,
} from "../lib/darwin.js";
import { requiredEnv } from "../lib/env.js";
import { activeDestinationPk, counterKey, listenerSk, userPk } from "../lib/keys.js";
import { trainNotification } from "../lib/notifications.js";
import { invokeReconciler } from "../lib/reconcile.js";
import type { ListenerItem, SubscriptionItem } from "../lib/types.js";
import { sendWebhook } from "../lib/webhook.js";

const tableName = requiredEnv("TABLE_NAME");

export type RawBatchHandoff = {
  bucketName: string;
  objectKey: string;
  records: number;
};

type RawCapturedLine = {
  value?: KafkaEnvelope;
};

type Match = {
  origin: DarwinLocation;
  destination: DarwinLocation;
  arrived: boolean;
};

type TrainSignals = {
  timeValue?: string;
  platformValue?: string;
  statusValue?: string;
};

type TrainChange = "train.time.changed" | "train.platform.changed" | "train.status.changed";

function findMatch(subscription: SubscriptionItem, update: DarwinUpdate): Match | undefined {
  if (subscription.serviceDate !== serviceDate(update)) {
    return undefined;
  }

  const locs = locations(update);
  const originIndex = locs.findIndex((loc) => loc.tpl?.toUpperCase() === subscription.originTpl);
  if (originIndex < 0) {
    return undefined;
  }

  const destinationIndex = locs.findIndex(
    (loc, index) => index > originIndex && loc.tpl?.toUpperCase() === subscription.destinationTpl,
  );
  if (destinationIndex < 0) {
    return undefined;
  }

  const origin = locs[originIndex];
  const destination = locs[destinationIndex];
  const planned = plannedDepartureAt(origin);
  if (
    !isSameTimeWindow(
      planned,
      subscription.plannedDepartureTime,
      subscription.timeWindowMinutes ?? 5,
    )
  ) {
    return undefined;
  }

  return {
    origin,
    destination,
    arrived: Boolean(actualArrivalAt(destination)),
  };
}

async function queryCandidateSubscriptions(update: DarwinUpdate): Promise<SubscriptionItem[]> {
  const ssd = serviceDate(update);
  if (!ssd) {
    return [];
  }

  const byKey = new Map<string, SubscriptionItem>();
  for (const tpl of uniqueTpls(update)) {
    const result = await ddb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "gsi1",
        KeyConditionExpression: "gsi1pk = :pk",
        ExpressionAttributeValues: {
          ":pk": activeDestinationPk(ssd, tpl),
        },
        Limit: 100,
      }),
    );

    for (const item of (result.Items ?? []) as SubscriptionItem[]) {
      byKey.set(`${item.pk}|${item.sk}`, item);
    }
  }

  return [...byKey.values()];
}

async function getListener(
  userId: string,
  listenerId: string,
  cache: Map<string, ListenerItem>,
): Promise<ListenerItem | undefined> {
  if (listenerId === defaultNotificationsListenerId) {
    return defaultNotificationsListener(userId);
  }

  const key = `${userId}#${listenerId}`;
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const result = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk: userPk(userId), sk: listenerSk(listenerId) },
    }),
  );

  const listener = result.Item as ListenerItem | undefined;
  if (listener) {
    cache.set(key, listener);
  }

  return listener;
}

function trainSignals(match: Match): TrainSignals {
  return {
    timeValue:
      estimatedArrivalAt(match.destination) ??
      actualArrivalAt(match.destination) ??
      match.origin.dep?.et ??
      match.origin.dep?.at ??
      "",
    platformValue: String(match.destination.plat ?? match.origin.plat ?? ""),
    statusValue: match.arrived ? "ARRIVED" : match.origin.dep?.at ? "DEPARTED" : "TRACKING",
  };
}

function changedNotifications(
  subscription: SubscriptionItem,
  signals: TrainSignals,
): TrainChange[] {
  const changes: TrainChange[] = [];

  if (
    subscription.latestTimeValue &&
    signals.timeValue &&
    subscription.latestTimeValue !== signals.timeValue
  ) {
    changes.push("train.time.changed");
  }
  if (
    subscription.latestPlatformValue &&
    signals.platformValue &&
    subscription.latestPlatformValue !== signals.platformValue
  ) {
    changes.push("train.platform.changed");
  }
  if (
    subscription.latestStatusValue &&
    signals.statusValue &&
    subscription.latestStatusValue !== signals.statusValue
  ) {
    changes.push("train.status.changed");
  }

  return changes;
}

function changePayload(
  type: TrainChange,
  subscription: SubscriptionItem,
  signals: TrainSignals,
  update: DarwinUpdate,
): Record<string, unknown> {
  return trainNotification(type, subscription, {
    field:
      type === "train.time.changed"
        ? "time"
        : type === "train.platform.changed"
          ? "platform"
          : "status",
    previous:
      type === "train.time.changed"
        ? subscription.latestTimeValue
        : type === "train.platform.changed"
          ? subscription.latestPlatformValue
          : subscription.latestStatusValue,
    current:
      type === "train.time.changed"
        ? signals.timeValue
        : type === "train.platform.changed"
          ? signals.platformValue
          : signals.statusValue,
    rid: rid(update),
    uid: uid(update),
  });
}

async function markObserved(
  subscription: SubscriptionItem,
  parsed: ParsedKafkaMessage,
  update: DarwinUpdate,
  signals: TrainSignals,
  notified: boolean,
): Promise<void> {
  const updateExpression = [
    "lastMessageId = :messageId",
    "latestRid = :rid",
    "latestUid = :uid",
    "latestTimeValue = :timeValue",
    "latestPlatformValue = :platformValue",
    "latestStatusValue = :statusValue",
    "updatedAt = :now",
    ...(notified ? ["lastNotifiedAt = :now"] : []),
  ].join(", ");

  await ddb.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { pk: subscription.pk, sk: subscription.sk },
      ConditionExpression: "active = :true",
      UpdateExpression: `SET ${updateExpression}`,
      ExpressionAttributeValues: {
        ":true": true,
        ":messageId": parsed.messageId,
        ":now": new Date().toISOString(),
        ":rid": rid(update),
        ":uid": uid(update),
        ":timeValue": signals.timeValue,
        ":platformValue": signals.platformValue,
        ":statusValue": signals.statusValue,
      },
    }),
  );
}

async function markArrived(
  subscription: SubscriptionItem,
  parsed: ParsedKafkaMessage,
  update: DarwinUpdate,
  signals: TrainSignals,
): Promise<boolean> {
  const now = new Date().toISOString();

  try {
    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: tableName,
              Key: { pk: subscription.pk, sk: subscription.sk },
              ConditionExpression: "active = :true",
              UpdateExpression:
                "SET active = :false, #status = :status, lastMessageId = :messageId, lastNotifiedAt = :now, latestRid = :rid, latestUid = :uid, latestTimeValue = :timeValue, latestPlatformValue = :platformValue, latestStatusValue = :statusValue, updatedAt = :now REMOVE gsi1pk, gsi1sk, gsi2pk, gsi2sk",
              ExpressionAttributeNames: { "#status": "status" },
              ExpressionAttributeValues: {
                ":true": true,
                ":status": "ARRIVED",
                ":messageId": parsed.messageId,
                ":now": now,
                ":rid": rid(update),
                ":uid": uid(update),
                ":timeValue": signals.timeValue,
                ":platformValue": signals.platformValue,
                ":statusValue": signals.statusValue,
              },
            },
          },
          {
            Update: {
              TableName: tableName,
              Key: counterKey,
              UpdateExpression: "SET updatedAt = :now ADD activeCount :minusOne",
              ExpressionAttributeValues: { ":now": now, ":minusOne": -1 },
            },
          },
        ],
      }),
    );

    return true;
  } catch (error) {
    console.warn("Failed to mark arrived, probably already inactive", {
      subscriptionId: subscription.subscriptionId,
      error,
    });
    return false;
  }
}

async function sendChangeNotifications(
  listener: ListenerItem,
  subscription: SubscriptionItem,
  signals: TrainSignals,
  update: DarwinUpdate,
  changes: TrainChange[],
): Promise<number> {
  let sent = 0;

  for (const type of changes) {
    try {
      await sendWebhook(listener, changePayload(type, subscription, signals, update));
      sent += 1;
    } catch (error) {
      console.error("Change notification failed", {
        subscriptionId: subscription.subscriptionId,
        type,
        error,
      });
    }
  }
  return sent;
}

async function sendStoppedNotification(
  listener: ListenerItem,
  subscription: SubscriptionItem,
  update: DarwinUpdate,
): Promise<boolean> {
  try {
    await sendWebhook(
      listener,
      trainNotification("train.listening.stopped", subscription, {
        field: "listening",
        current: "ARRIVED",
        rid: rid(update),
        uid: uid(update),
      }),
    );

    return true;
  } catch (error) {
    console.error("Stopped notification failed", {
      subscriptionId: subscription.subscriptionId,
      error,
    });
    return false;
  }
}

async function processParsedMessage(
  parsed: ParsedKafkaMessage,
  listenerCache: Map<string, ListenerItem>,
): Promise<{ matched: number; arrived: number }> {
  const update = parsed.update;
  if (!update?.uR?.TS) {
    return { matched: 0, arrived: 0 };
  }

  let matched = 0;
  let arrived = 0;
  const candidates = await queryCandidateSubscriptions(update);

  for (const subscription of candidates) {
    if (!subscription.active) {
      continue;
    }
    if (subscription.lastMessageId === parsed.messageId) {
      continue;
    }

    const match = findMatch(subscription, update);
    if (!match) {
      continue;
    }

    const listener = await getListener(subscription.userId, subscription.listenerId, listenerCache);
    if (!listener) {
      console.warn("Missing listener for subscription", {
        subscriptionId: subscription.subscriptionId,
        listenerId: subscription.listenerId,
      });
      continue;
    }

    const signals = trainSignals(match);
    const changes = changedNotifications(subscription, signals);
    console.log("Matched subscription", {
      subscriptionId: subscription.subscriptionId,
      rid: rid(update),
      uid: uid(update),
      arrived: match.arrived,
      changes,
    });

    matched += await sendChangeNotifications(listener, subscription, signals, update, changes);

    if (match.arrived) {
      if (await sendStoppedNotification(listener, subscription, update)) {
        matched += 1;
      }
      if (await markArrived(subscription, parsed, update, signals)) {
        arrived += 1;
      }
    } else {
      await markObserved(subscription, parsed, update, signals, changes.length > 0);
    }
  }

  return { matched, arrived };
}

async function loadCapturedMessages(event: RawBatchHandoff): Promise<ParsedKafkaMessage[]> {
  const result = await s3.send(
    new GetObjectCommand({
      Bucket: event.bucketName,
      Key: event.objectKey,
    }),
  );
  if (!result.Body) {
    throw new Error(`Captured batch has no body: ${event.objectKey}`);
  }

  const bytes = await result.Body.transformToByteArray();
  const ndjson = gunzipSync(Buffer.from(bytes)).toString("utf8");
  const messages: ParsedKafkaMessage[] = [];

  for (const line of ndjson.trimEnd().split("\n")) {
    const captured = JSON.parse(line) as RawCapturedLine;
    if (captured.value) {
      messages.push(parseKafkaEnvelope(captured.value));
    }
  }

  return messages;
}

export async function handler(
  event: RawBatchHandoff,
): Promise<{ records: number; processed: number; matched: number; arrived: number }> {
  const messages = await loadCapturedMessages(event);
  const listenerCache = new Map<string, ListenerItem>();
  let matched = 0;
  let arrived = 0;

  for (const parsed of messages) {
    const result = await processParsedMessage(parsed, listenerCache);
    matched += result.matched;
    arrived += result.arrived;
  }

  if (arrived > 0) {
    await invokeReconciler();
  }

  return { records: event.records, processed: messages.length, matched, arrived };
}
