import type { LoaderFunctionArgs } from "react-router";

import { getGitHubGists } from "@/lib/data/github";
import { CDN_CACHE_HEADERS } from "@/lib/constants";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const data = await getGitHubGists({
    request,
    executionContext: context?.cloudflare?.ctx,
  });
  return Response.json(data, {
    headers: CDN_CACHE_HEADERS,
  });
}
