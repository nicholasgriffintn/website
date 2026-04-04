import { getEnvValue } from "@/lib/env";
import { isRecord } from "@/lib/type-guards";

const TURNSTILE_SITE_KEY_ENV_NAME = "VITE_EMAIL_TURNSTILE_SITE_KEY";

export function getTurnstileSiteKey(context?: unknown) {
  let runtimeSiteKey: unknown;

  if (isRecord(context)) {
    const cloudflare = context.cloudflare;
    if (isRecord(cloudflare) && isRecord(cloudflare.env)) {
      runtimeSiteKey = cloudflare.env[TURNSTILE_SITE_KEY_ENV_NAME];
    }
  }

  if (typeof runtimeSiteKey === "string" && runtimeSiteKey.trim().length > 0) {
    return runtimeSiteKey;
  }

  const processSiteKey = getEnvValue(TURNSTILE_SITE_KEY_ENV_NAME);
  if (typeof processSiteKey === "string" && processSiteKey.trim().length > 0) {
    return processSiteKey;
  }

  return "";
}
