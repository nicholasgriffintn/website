import { TURNSTILE_FIELD } from "@/lib/forms/constants";

const DEFAULT_CONTACT_API_URL = "https://email.nicholasgriffin.dev";
const CONTACT_API_URL = import.meta.env.VITE_CONTACT_API_URL || DEFAULT_CONTACT_API_URL;

function hasBooleanOk(value: unknown): value is { ok: boolean } {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    typeof (value as { ok: unknown }).ok === "boolean"
  );
}

export type EmailSubmissionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      kind: "upstream" | "network";
    };

export type EmailSubmissionFailureKind = Extract<EmailSubmissionResult, { ok: false }>["kind"];

export interface EmailSubmissionPayload {
  from: string;
  subject: string;
  body: string;
  turnstileToken: string;
}

export function createEmailSubmissionFormData(payload: EmailSubmissionPayload) {
  const outbound = new FormData();
  outbound.set("from", payload.from);
  outbound.set("subject", payload.subject);
  outbound.set("body", payload.body);
  outbound.set(TURNSTILE_FIELD, payload.turnstileToken);
  return outbound;
}

export function getSubmissionFailureStatus(kind: EmailSubmissionFailureKind) {
  return kind === "upstream" ? 502 : 503;
}

export async function submitEmailRequest(formData: FormData): Promise<EmailSubmissionResult> {
  try {
    const response = await fetch(CONTACT_API_URL, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    let payload: unknown;
    try {
      payload = await response.clone().json();
    } catch {
      payload = undefined;
    }

    const ok = hasBooleanOk(payload) ? payload.ok : response.ok;

    if (ok) {
      return { ok: true };
    }

    return {
      ok: false,
      kind: "upstream",
    };
  } catch {
    return {
      ok: false,
      kind: "network",
    };
  }
}
