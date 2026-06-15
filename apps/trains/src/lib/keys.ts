export const counterKey = { pk: "META", sk: "ACTIVE_COUNT" };

export function userPk(userId: string): string {
  return `USER#${userId}`;
}

export function listenerSk(listenerId: string): string {
  return `LISTENER#${listenerId}`;
}

export function subscriptionSk(subscriptionId: string): string {
  return `SUB#${subscriptionId}`;
}

export function activeDestinationPk(serviceDate: string, destinationTpl: string): string {
  return `ACTIVE#${serviceDate}#DEST#${destinationTpl.toUpperCase()}`;
}

export function activeSubscriptionSk(
  originTpl: string,
  plannedDepartureTime: string,
  subscriptionId: string,
): string {
  return `ORIG#${originTpl.toUpperCase()}#PTD#${plannedDepartureTime}#SUB#${subscriptionId}`;
}

export function expiresSk(epochSeconds: number, subscriptionId: string): string {
  return `${String(epochSeconds).padStart(10, "0")}#${subscriptionId}`;
}

export function nowEpochSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
