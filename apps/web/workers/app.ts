import { createRequestHandler } from "react-router";
import { stripTrailingSlash } from "@/lib/url";

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

export default {
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
