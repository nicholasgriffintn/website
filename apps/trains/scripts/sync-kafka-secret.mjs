#!/usr/bin/env node
import { PutSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const appRoot = dirname(dirname(__filename));
const envPath = process.env.TRAINS_ENV_FILE ?? join(appRoot, ".env");

if (!existsSync(envPath)) {
  throw new Error(`Missing env file: ${envPath}`);
}

process.loadEnvFile(envPath);

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const username = requiredEnv("RDM_KAFKA_USERNAME");
const password = requiredEnv("RDM_KAFKA_PASSWORD");
const notificationsWebhookToken = requiredEnv("NOTIFICATIONS_WEBHOOK_TOKEN");
const secretsManager = new SecretsManagerClient({});
const kafkaSecretId =
  process.env.TRAINS_KAFKA_CREDENTIALS_SECRET_ID ?? "train-kafka-capture/kafka/basic-auth";
const notificationsSecretId =
  process.env.TRAINS_NOTIFICATIONS_WEBHOOK_TOKEN_SECRET_ID ??
  "train-kafka-capture/notifications-webhook-token";

await secretsManager.send(
  new PutSecretValueCommand({
    SecretId: kafkaSecretId,
    SecretString: JSON.stringify({ username, password }),
  }),
);

console.log(`Updated Kafka credentials secret: ${kafkaSecretId}`);

await secretsManager.send(
  new PutSecretValueCommand({
    SecretId: notificationsSecretId,
    SecretString: JSON.stringify({ token: notificationsWebhookToken }),
  }),
);

console.log(`Updated notifications webhook token secret: ${notificationsSecretId}`);
