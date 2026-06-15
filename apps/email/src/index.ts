import { withSentry } from "@sentry/cloudflare";

import { SENTRY_DSN, SENTRY_TRACES_SAMPLE_RATE } from "./constants";
import { handleContactForm } from "./lib/contact-form";
import { corsHeadersFor, isOriginAllowed } from "./lib/cors";
import { handleInboundEmail } from "./lib/inbound-email";
import { handleNotificationEmail } from "./lib/notification-email";
import type { Env } from "./types";

const handler: ExportedHandler<Env> = {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname === "/internal/notifications/email") {
      return handleNotificationEmail(request, env);
    }

    const corsHeaders = corsHeadersFor(request, env);
    if (!isOriginAllowed(request, corsHeaders)) {
      return Response.json(
        { ok: false, reason: "Origin not allowed" },
        { status: 403, headers: corsHeaders },
      );
    }

    if (request.method === "OPTIONS") {
      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return Response.json(
        { ok: false, reason: "Method not allowed" },
        { status: 405, headers: corsHeaders },
      );
    }

    return handleContactForm(request, env, corsHeaders);
  },
  email: handleInboundEmail,
};

export default withSentry<Env>(
  () => ({
    dsn: SENTRY_DSN,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
  }),
  handler,
);
