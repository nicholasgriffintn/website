import { withSentry } from "@sentry/cloudflare";
import { createRequestHandler } from "react-router";
import { stripTrailingSlash } from "@/lib/url";
import { SENTRY_DSN, SENTRY_TRACES_SAMPLE_RATE } from "@/lib/monitoring/sentry-shared";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: CloudflareEnv;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

const handler = {
  async fetch(request, env: CloudflareEnv, ctx: ExecutionContext) {
    if (request.method === "GET" || request.method === "HEAD") {
      const redirectUrl = new URL(request.url);
      const canonicalPathname = stripTrailingSlash(redirectUrl.pathname);

      if (canonicalPathname !== redirectUrl.pathname) {
        redirectUrl.pathname = canonicalPathname;
        return Response.redirect(redirectUrl.toString(), 301);
      }
    }

    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<CloudflareEnv>;

export default withSentry(
  () => ({
    dsn: SENTRY_DSN,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
    environment: import.meta.env.MODE,
  }),
  handler,
);
