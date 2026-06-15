import type { SubscriptionItem } from "./types.js";

export function publicSubscription(item: SubscriptionItem): Record<string, unknown> {
  return {
    subscriptionId: item.subscriptionId,
    listenerId: item.listenerId,
    originTpl: item.originTpl,
    destinationTpl: item.destinationTpl,
    serviceDate: item.serviceDate,
    plannedDepartureTime: item.plannedDepartureTime,
    timeWindowMinutes: item.timeWindowMinutes,
    active: item.active,
    status: item.status,
    expiresAtEpochSeconds: item.expiresAtEpochSeconds,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    lastNotifiedAt: item.lastNotifiedAt,
    latestRid: item.latestRid,
    latestUid: item.latestUid,
    latestTimeValue: item.latestTimeValue,
    latestPlatformValue: item.latestPlatformValue,
    latestStatusValue: item.latestStatusValue,
  };
}
