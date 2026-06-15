#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TrainKafkaCaptureStack } from "../src/infra/train-kafka-capture-stack.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "../.env");
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const app = new cdk.App();

const envContext: Record<string, string | undefined> = {
  kafkaBootstrapServer: process.env.RDM_KAFKA_BOOTSTRAP_SERVERS,
  kafkaTopic: process.env.RDM_REALTIME_KAFKA_TOPIC,
  kafkaConsumerGroupId: process.env.RDM_KAFKA_USER_GROUP,
};

for (const [key, value] of Object.entries(envContext)) {
  if (value) app.node.setContext(key, value);
}

new TrainKafkaCaptureStack(app, "TrainKafkaCaptureStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "eu-west-2",
  },
});
