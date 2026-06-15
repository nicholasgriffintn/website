import type { DarwinLocation, DarwinUpdate } from "./darwin.js";
import type { ListenerItem, SubscriptionItem } from "./types.js";

export type WebhookPayload = {
  type: "train.update" | "train.arrived";
  subscription: {
    subscriptionId: string;
    originTpl: string;
    destinationTpl: string;
    serviceDate: string;
    plannedDepartureTime: string;
  };
  train: {
    rid?: string;
    uid?: string;
    updateTimestamp?: string;
    origin?: DarwinLocation;
    destination?: DarwinLocation;
    locations: DarwinLocation[];
  };
  raw: DarwinUpdate;
};

export type NotificationPayload = WebhookPayload | Record<string, unknown>;

export async function sendWebhook(
  listener: ListenerItem,
  payload: NotificationPayload,
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);

  try {
    const response = await fetch(listener.webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${listener.webhookToken}`,
        "x-train-event-type": String(payload.type),
        "user-agent": "ng-trains/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

export function payloadFor(
  subscription: SubscriptionItem,
  update: DarwinUpdate,
  origin: DarwinLocation | undefined,
  destination: DarwinLocation | undefined,
  arrived: boolean,
): WebhookPayload {
  return {
    type: arrived ? "train.arrived" : "train.update",
    subscription: {
      subscriptionId: subscription.subscriptionId,
      originTpl: subscription.originTpl,
      destinationTpl: subscription.destinationTpl,
      serviceDate: subscription.serviceDate,
      plannedDepartureTime: subscription.plannedDepartureTime,
    },
    train: {
      rid: update.uR?.TS?.rid,
      uid: update.uR?.TS?.uid,
      updateTimestamp: update.ts,
      origin,
      destination,
      locations: update.uR?.TS?.Location ?? [],
    },
    raw: update,
  };
}
