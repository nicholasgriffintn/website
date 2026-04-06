import { renderToReadableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import type { EntryContext, HandleErrorFunction } from "react-router";

import { reportApplicationError } from "@/lib/error-reporting";
import { captureServerError } from "@/lib/monitoring/sentry-server";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error: unknown) {
        if (request.signal.aborted) {
          return;
        }

        const context = {
          source: "react-dom-server",
          method: request.method,
          url: request.url,
        } as const;

        captureServerError(error, context);
        reportApplicationError(error, context);
        responseStatusCode = 500;
      },
    },
  );

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

export const handleError: HandleErrorFunction = (error, { request, params }) => {
  if (request.signal.aborted) {
    return;
  }

  const context = {
    source: "react-router-server",
    method: request.method,
    url: request.url,
    params,
  } as const;

  captureServerError(error, context);
  reportApplicationError(error, context);
};
