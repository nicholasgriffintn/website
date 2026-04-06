import { useEffect } from "react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router";
import * as Sentry from "@sentry/react";

import type { ErrorReportContext } from "@/lib/error-reporting";
import {
  buildSentryCaptureContext,
  SENTRY_DSN,
  SENTRY_TRACES_SAMPLE_RATE,
} from "@/lib/monitoring/sentry-shared";

let isSentryClientInitialised = false;

export function initClientSentry() {
  if (isSentryClientInitialised || !SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
    ],
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
    environment: import.meta.env.MODE,
  });

  isSentryClientInitialised = true;
}

export function captureClientError(error: unknown, context: ErrorReportContext) {
  if (!SENTRY_DSN) {
    return;
  }

  initClientSentry();
  Sentry.captureException(error, buildSentryCaptureContext(context));
}
