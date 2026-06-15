import { dispatchNotification } from "./lib/email-dispatch";
import { parseMessage } from "./lib/messages";
import { bearerToken, timingSafeEqual } from "./lib/security";
import type { Env, NotificationMessage } from "./types";

const handler: ExportedHandler<Env> = {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return Response.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
    }

    const token = bearerToken(request);
    if (!token || !timingSafeEqual(token, env.NOTIFICATIONS_TOKEN)) {
      return Response.json({ ok: false, error: "unauthorised" }, { status: 401 });
    }

    let message: NotificationMessage;
    try {
      message = parseMessage(await request.json());
    } catch (error) {
      return Response.json(
        { ok: false, error: error instanceof Error ? error.message : "invalid_request" },
        { status: 400 },
      );
    }

    await dispatchNotification(env, message);
    return Response.json({ ok: true });
  },
};

export default handler;
