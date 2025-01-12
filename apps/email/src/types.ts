import type { R2Bucket, SendEmail } from "@cloudflare/workers-types";

export interface Env {
  FORWARD_TO: string;
  SEND_TO: string;
  R2_BUCKET: R2Bucket
  TURNSTILE_SITE_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  EMAIL: SendEmail;
}

type ErrorCode =
  | "missing-input-secret"
  | "invalid-input-secret"
  | "missing-input-response"
  | "invalid-input-response"
  | "invalid-widget-id"
  | "invalid-parsed-secret"
  | "bad-request"
  | "timeout-or-duplicate"
  | "internal-error";

export type SiteVerify =
  | {
      success: true;
      challenge_ts: string;
      hostname: string;
      "error-codes": [];
      action: string;
      cdata: string;
    }
  | {
      success: false;
      "error-codes": ErrorCode[];
    };