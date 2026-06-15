import type { ListenerItem } from "./types.js";
import { sendWebhook } from "./webhook.js";

export async function sendNotification(
  listener: ListenerItem,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await sendWebhook(listener, payload);
  } catch (error) {
    console.error("Notification delivery failed", { listenerId: listener.listenerId, error });
  }
}
