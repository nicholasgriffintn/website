import * as Sentry from "@sentry/cloudflare";

import type { ErrorReportContext } from "@/lib/error-reporting";
import { buildSentryCaptureContext } from "@/lib/monitoring/sentry-shared";

export function captureServerError(error: unknown, context: ErrorReportContext) {
  Sentry.captureException(error, buildSentryCaptureContext(context));
}
