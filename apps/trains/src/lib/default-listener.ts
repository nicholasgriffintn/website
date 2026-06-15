import { requiredEnv } from "./env.js";
import type { ListenerItem } from "./types.js";

export const defaultNotificationsListenerId = "lst_default_notifications";

export function defaultNotificationsListener(userId: string): ListenerItem {
  const now = new Date().toISOString();

  return {
    pk: `USER#${userId}`,
    sk: `LISTENER#${defaultNotificationsListenerId}`,
    entityType: "LISTENER",
    userId,
    listenerId: defaultNotificationsListenerId,
    name: "Default notifications",
    webhookUrl: requiredEnv("NOTIFICATIONS_WEBHOOK_URL"),
    webhookToken: requiredEnv("NOTIFICATIONS_WEBHOOK_TOKEN"),
    createdAt: now,
    updatedAt: now,
  };
}
