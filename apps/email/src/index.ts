import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";
import type { ExecutionContext } from "@cloudflare/workers-types";
import PostalMime from "postal-mime";

import type { Env, SiteVerify } from "./types";

const blockList: string[] = [];
const defaultAllowedOrigins = [
  "https://nicholasgriffin.dev",
  "https://preview.nicholasgriffin.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function trimTrailingSlashes(value: string): string {
  let end = value.length;

  while (end > 0 && value.charCodeAt(end - 1) === 47) {
    end -= 1;
  }

  return value.slice(0, end);
}

function normaliseOrigin(origin: string): string | null {
  const trimmedOrigin = origin.trim();
  if (!trimmedOrigin) {
    return null;
  }

  try {
    return new URL(trimmedOrigin).origin;
  } catch {
    return trimTrailingSlashes(trimmedOrigin);
  }
}

function getAllowedOrigins(env: Env): string[] {
  const configuredOrigins =
    env.ALLOWED_ORIGINS?.split(",")
      .map((origin) => normaliseOrigin(origin))
      .filter((origin): origin is string => Boolean(origin)) || [];

  return [...new Set([...defaultAllowedOrigins, ...configuredOrigins])];
}

function getCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

export default {
  async fetch(request: Request, env: Env) {
    const allowedOrigins = getAllowedOrigins(env);
    const requestOrigin = request.headers.get("Origin");
    const normalisedRequestOrigin = requestOrigin ? normaliseOrigin(requestOrigin) : null;
    const allowOrigin =
      normalisedRequestOrigin && allowedOrigins.includes(normalisedRequestOrigin)
        ? normalisedRequestOrigin
        : null;
    const corsHeaders = getCorsHeaders(allowOrigin);
    const method = request.method;

    if (requestOrigin && !allowOrigin) {
      return Response.json(
        { ok: false, reason: "Origin not allowed" },
        { status: 403, headers: corsHeaders },
      );
    }

    if (method === "OPTIONS") {
      if (
        request.headers.get("Origin") &&
        request.headers.get("Access-Control-Request-Method") &&
        request.headers.get("Access-Control-Request-Headers")
      ) {
        return Response.json({ ok: true }, { headers: corsHeaders });
      }

      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    if (method !== "POST") {
      return Response.json(
        { ok: false, reason: "Method not allowed" },
        { status: 405, headers: corsHeaders },
      );
    }

    const ip = request.headers.get("cf-connecting-ip");

    const formData = await request.formData();

    const token = formData.get("cf-turnstile-response") as string;
    const from = formData.get("from") as string;
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;

    if (!token || !from || !subject || !body) {
      console.log("Missing required fields");
      return Response.json(
        { ok: false, error: "missing_required_fields" },
        { status: 400, headers: corsHeaders },
      );
    }

    if (blockList.includes(from)) {
      return Response.json(
        { ok: false, error: "blocked_sender" },
        { status: 400, headers: corsHeaders },
      );
    }

    const validateTokenData = new FormData();
    validateTokenData.set("secret", env.TURNSTILE_SECRET_KEY);
    validateTokenData.set("response", token);
    if (ip !== null && ip !== undefined) {
      validateTokenData.set("remoteip", ip);
    }

    const validateTokenUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    const validateTokenResponse = await fetch(validateTokenUrl, {
      body: validateTokenData,
      method: "POST",
    });

    const validateTokenOutcome = (await validateTokenResponse.json()) as SiteVerify;
    if (!validateTokenOutcome.success) {
      console.log("Invalid token", validateTokenOutcome["error-codes"]);
      return Response.json(
        {
          ok: false,
          error: "invalid_turnstile_token",
          turnstile_errors: validateTokenOutcome["error-codes"],
        },
        { status: 400, headers: corsHeaders },
      );
    }

    const msg = createMimeMessage();
    msg.setSender({
      name: "Contact Form Submission",
      addr: "website@nicholasgriffin.dev",
    });
    msg.setRecipient(env.FORWARD_TO);
    msg.setSubject(subject);
    msg.addMessage({
      contentType: "text/plain",
      data: `
From: ${from}
Subject: ${subject}

Message:
${body}
`,
    });

    try {
      const message = new EmailMessage("website@nicholasgriffin.dev", env.FORWARD_TO, msg.asRaw());

      await env.EMAIL.send(message);

      if (env.R2_BUCKET) {
        const date = new Date().toISOString();
        const emailId = `${date}-${from}`;

        await env.R2_BUCKET.put(
          `${emailId}/email.json`,
          JSON.stringify({
            from,
            subject,
            message: msg.asRaw(),
          }),
        );
      }
    } catch (e) {
      console.error("Error sending email", e);
      if (e instanceof Error) {
        return Response.json(
          { ok: false, reason: "Error sending email" },
          { status: 500, headers: corsHeaders },
        );
      }

      return Response.json(
        { ok: false, reason: "Unknown error" },
        { status: 500, headers: corsHeaders },
      );
    }

    return Response.json({ ok: true }, { status: 200, headers: corsHeaders });
  },
  async email(message: EmailMessage, env: Env, ctx: ExecutionContext) {
    if (blockList.includes(message.from)) {
      // @ts-ignore - types seem to be wrong
      message.setReject("Address is blocked");
      return;
    }

    const parser = new PostalMime();

    // @ts-ignore - types seem to be wrong
    const rawEmail = new Response(message.raw);
    const email = await parser.parse(await rawEmail.arrayBuffer());

    console.log(email);

    if (env.R2_BUCKET) {
      const date = new Date().toISOString();
      if (!email.from || !email.from.address) {
        console.error("Email is missing 'from' address");
        return;
      }
      const emailId = `${date}-${email.from.address}`;

      const attachments = email.attachments;

      const attachmentPromises = attachments.map(async (attachment) => {
        const attachmentId = `${emailId}/${attachment.filename}`;
        await env.R2_BUCKET.put(attachmentId, attachment.content);
      });

      await Promise.all(attachmentPromises);

      await env.R2_BUCKET.put(`${emailId}/email.json`, JSON.stringify(email));
    }

    // @ts-ignore - types seem to be wrong
    await message.forward(env.FORWARD_TO);
  },
};
