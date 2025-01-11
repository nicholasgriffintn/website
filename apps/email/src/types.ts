import type { R2Bucket } from "@cloudflare/workers-types";

export interface Env {
  FORWARD_TO: string;
  R2_BUCKET: R2Bucket
}