export type ListenerItem = {
  pk: string;
  sk: string;
  entityType: "LISTENER";
  userId: string;
  listenerId: string;
  name: string;
  webhookUrl: string;
  webhookToken: string;
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionStatus = "ACTIVE" | "ARRIVED" | "EXPIRED" | "CANCELLED";

export type SubscriptionItem = {
  pk: string;
  sk: string;
  entityType: "SUBSCRIPTION";
  userId: string;
  subscriptionId: string;
  listenerId: string;
  originTpl: string;
  destinationTpl: string;
  serviceDate: string;
  plannedDepartureTime: string;
  timeWindowMinutes: number;
  active: boolean;
  status: SubscriptionStatus;
  expiresAtEpochSeconds: number;
  gsi1pk?: string;
  gsi1sk?: string;
  gsi2pk?: string;
  gsi2sk?: string;
  ttl: number;
  createdAt: string;
  updatedAt: string;
  lastMessageId?: string;
  lastNotifiedAt?: string;
  latestRid?: string;
  latestUid?: string;
  latestTimeValue?: string;
  latestPlatformValue?: string;
  latestStatusValue?: string;
};

export type ActiveCounterItem = {
  pk: "META";
  sk: "ACTIVE_COUNT";
  activeCount: number;
  updatedAt?: string;
};
