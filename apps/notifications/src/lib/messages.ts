import { handlers } from "../config";
import type { NotificationMessage, NotificationType } from "../types";

function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === "string" && value in handlers;
}

export function parseMessage(value: unknown): NotificationMessage {
  if (!value || typeof value !== "object") {
    throw new Error("message must be an object");
  }

  const message = value as Partial<NotificationMessage>;

  if (!isNotificationType(message.type)) {
    throw new Error("unknown notification type");
  }
  if (!message.subscription?.subscriptionId) {
    throw new Error("subscription is required");
  }
  if (!message.occurredAt) {
    throw new Error("occurredAt is required");
  }

  return message as NotificationMessage;
}
