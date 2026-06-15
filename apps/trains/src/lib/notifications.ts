import type { SubscriptionItem } from "./types.js";

type NotificationType =
  | "train.listening.started"
  | "train.listening.stopped"
  | "train.time.changed"
  | "train.platform.changed"
  | "train.status.changed";

export function trainNotification(
  type: NotificationType,
  subscription: SubscriptionItem,
  train: Record<string, string | undefined> = {},
): Record<string, unknown> {
  return {
    type,
    occurredAt: new Date().toISOString(),
    subscription: {
      subscriptionId: subscription.subscriptionId,
      originTpl: subscription.originTpl,
      destinationTpl: subscription.destinationTpl,
      serviceDate: subscription.serviceDate,
      plannedDepartureTime: subscription.plannedDepartureTime,
    },
    train,
  };
}
