import type { EmailRequest, Env, NotificationMessage, NotificationType } from "./types";

type Handler = {
  subject(message: NotificationMessage): string;
  text(message: NotificationMessage): string;
};

const titles: Record<NotificationType, string> = {
  "train.listening.started": "Train tracking started",
  "train.listening.stopped": "Train tracking stopped",
  "train.time.changed": "Train time changed",
  "train.platform.changed": "Train platform changed",
  "train.status.changed": "Train status changed",
};

function route(message: NotificationMessage): string {
  return `${message.subscription.originTpl} to ${message.subscription.destinationTpl}`;
}

function details(message: NotificationMessage): string {
  const lines = [
    `Route: ${route(message)}`,
    `Service date: ${message.subscription.serviceDate}`,
    `Planned departure: ${message.subscription.plannedDepartureTime}`,
    `Subscription: ${message.subscription.subscriptionId}`,
  ];

  if (message.train.rid) {
    lines.push(`RID: ${message.train.rid}`);
  }
  if (message.train.uid) {
    lines.push(`UID: ${message.train.uid}`);
  }
  if (message.train.previous || message.train.current) {
    lines.push(`Previous: ${message.train.previous ?? "unknown"}`);
    lines.push(`Current: ${message.train.current ?? "unknown"}`);
  }

  return lines.join("\n");
}

const defaultHandler: Handler = {
  subject(message) {
    return `${titles[message.type]}: ${route(message)}`;
  },
  text(message) {
    return `${titles[message.type]}\n\n${details(message)}`;
  },
};

export const handlers: Record<NotificationType, Handler> = {
  "train.listening.started": defaultHandler,
  "train.listening.stopped": defaultHandler,
  "train.time.changed": defaultHandler,
  "train.platform.changed": defaultHandler,
  "train.status.changed": defaultHandler,
};

export function emailRequestFor(env: Env, message: NotificationMessage): EmailRequest {
  const handler = handlers[message.type];
  return {
    to: env.NOTIFICATION_EMAIL_TO,
    subject: handler.subject(message),
    text: handler.text(message),
  };
}
