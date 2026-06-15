import type { Env, SiteVerify } from "../types";
import { createRawPlainEmail } from "./email-message";

const blockList: string[] = [];

type ContactSubmission = {
  token: string;
  from: string;
  subject: string;
  body: string;
};

function readSubmission(formData: FormData): ContactSubmission | undefined {
  const token = formData.get("cf-turnstile-response");
  const from = formData.get("from");
  const subject = formData.get("subject");
  const body = formData.get("body");

  if (
    typeof token !== "string" ||
    typeof from !== "string" ||
    typeof subject !== "string" ||
    typeof body !== "string"
  ) {
    return undefined;
  }

  if (!token || !from || !subject || !body) {
    return undefined;
  }

  return { token, from, subject, body };
}

async function verifyTurnstile(
  env: Env,
  submission: ContactSubmission,
  ip: string | null,
): Promise<SiteVerify> {
  const validateTokenData = new FormData();
  validateTokenData.set("secret", env.TURNSTILE_SECRET_KEY);
  validateTokenData.set("response", submission.token);
  if (ip !== null) {
    validateTokenData.set("remoteip", ip);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    body: validateTokenData,
    method: "POST",
  });

  return (await response.json()) as SiteVerify;
}

export async function handleContactForm(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const submission = readSubmission(await request.formData());
  if (!submission) {
    console.log("Missing required fields");
    return Response.json(
      { ok: false, error: "missing_required_fields" },
      { status: 400, headers: corsHeaders },
    );
  }

  if (blockList.includes(submission.from)) {
    return Response.json(
      { ok: false, error: "blocked_sender" },
      { status: 400, headers: corsHeaders },
    );
  }

  const validateTokenOutcome = await verifyTurnstile(
    env,
    submission,
    request.headers.get("cf-connecting-ip"),
  );
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

  try {
    const { message, raw } = createRawPlainEmail({
      senderName: "Contact Form Submission",
      from: "website@nicholasgriffin.dev",
      to: env.FORWARD_TO,
      subject: submission.subject,
      text: `
From: ${submission.from}
Subject: ${submission.subject}

Message:
${submission.body}
`,
    });

    await env.EMAIL.send(message);

    if (env.R2_BUCKET) {
      const date = new Date().toISOString();
      await env.R2_BUCKET.put(
        `${date}-${submission.from}/email.json`,
        JSON.stringify({
          from: submission.from,
          subject: submission.subject,
          message: raw,
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
}
