import type { ErrorReportContext } from "@/lib/error-reporting";

export const SENTRY_DSN = "https://60683030642749f18d99b6071c409d61@ingest.bitwobbly.com/21";
export const SENTRY_TRACES_SAMPLE_RATE = 1.0;

export function buildSentryCaptureContext(context: ErrorReportContext) {
  const tags: Record<string, string> = {
    error_source: context.source,
  };

  if (context.method) {
    tags.request_method = context.method;
  }

  if (context.routePattern) {
    tags.route_pattern = context.routePattern;
  }

  const extra = {
    request_url: context.url,
    params: context.params,
    component_stack: context.componentStack,
  };

  return { tags, extra };
}
