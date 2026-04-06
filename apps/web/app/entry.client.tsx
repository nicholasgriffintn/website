import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import type { ClientOnErrorFunction } from "react-router";
import { HydratedRouter } from "react-router/dom";

import { reportApplicationError } from "@/lib/error-reporting";
import { captureClientError, initClientSentry } from "@/lib/monitoring/sentry-client";

const onError: ClientOnErrorFunction = (
  error,
  { location, params, unstable_pattern, errorInfo },
) => {
  const context = {
    source: "react-router-client",
    url: `${location.pathname}${location.search ?? ""}${location.hash ?? ""}`,
    routePattern: unstable_pattern ?? undefined,
    params,
    componentStack: errorInfo?.componentStack ?? undefined,
  } as const;

  captureClientError(error, context);
  reportApplicationError(error, context);
};

initClientSentry();

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter onError={onError} />
    </StrictMode>,
  );
});
