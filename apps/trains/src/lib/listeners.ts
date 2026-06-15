import type { ListenerItem } from "./types.js";

export function publicListener(item: ListenerItem): Record<string, unknown> {
  return {
    listenerId: item.listenerId,
    name: item.name,
    webhookUrl: item.webhookUrl,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
