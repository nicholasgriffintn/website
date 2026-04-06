import * as Sentry from "@sentry/cloudflare";
import { isRouteErrorResponse } from "react-router";

import type { ErrorReportContext } from "@/lib/error-reporting";
import { buildSentryCaptureContext } from "@/lib/monitoring/sentry-shared";

export function captureServerError(error: unknown, context: ErrorReportContext) {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return;
  }

  Sentry.captureException(error, buildSentryCaptureContext(context));
}
