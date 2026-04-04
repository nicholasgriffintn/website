import type { LoaderFunctionArgs } from "react-router";

import { getRecentlyPlayed } from "@/lib/apple-music/getRecentlyPlayed";
import { CDN_CACHE_HEADERS } from "@/lib/constants";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const data = await getRecentlyPlayed(10, {
    request,
    executionContext: context?.cloudflare?.ctx,
  });
  return Response.json(data, {
    headers: CDN_CACHE_HEADERS,
  });
}
