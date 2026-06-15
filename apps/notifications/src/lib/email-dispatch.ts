import { emailRequestFor } from "../config";
import type { EmailRequest, Env, NotificationMessage } from "../types";

async function sendEmail(env: Env, email: EmailRequest): Promise<void> {
  const response = await env.EMAIL_SERVICE.fetch(
    "https://email.internal/internal/notifications/email",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.EMAIL_SERVICE_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(email),
    },
  );

  if (!response.ok) {
    throw new Error(`Email service failed: ${response.status}`);
  }
}

export async function dispatchNotification(env: Env, message: NotificationMessage): Promise<void> {
  await sendEmail(env, emailRequestFor(env, message));
}
