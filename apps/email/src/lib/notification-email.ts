import type { Env } from "../types";
import { createPlainEmail } from "./email-message";
import { bearerToken, timingSafeEqual } from "./security";

type NotificationEmailBody = Partial<{
  to: string;
  subject: string;
  text: string;
}>;

export async function handleNotificationEmail(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
  }

  if (!env.EMAIL_SERVICE_TOKEN) {
    return Response.json({ ok: false, error: "service_not_configured" }, { status: 503 });
  }

  const token = bearerToken(request);
  if (!token || !timingSafeEqual(token, env.EMAIL_SERVICE_TOKEN)) {
    return Response.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }

  const body = await request.json<NotificationEmailBody>();
  if (!body.subject || !body.text) {
    return Response.json({ ok: false, error: "missing_required_fields" }, { status: 400 });
  }

  await env.EMAIL.send(
    createPlainEmail({
      senderName: "Notifications",
      from: "website@nicholasgriffin.dev",
      to: body.to || env.FORWARD_TO,
      subject: body.subject,
      text: body.text,
    }),
  );

  return Response.json({ ok: true });
}
