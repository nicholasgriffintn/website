import type { LoaderFunctionArgs } from "react-router";

import { getRecentlyPlayedMusic } from "@/lib/music/getRecentlyPlayed";
import { CDN_CACHE_HEADERS } from "@/lib/constants";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const cacheContext = {
    request,
    executionContext: context?.cloudflare?.ctx,
  };

  const data = await getRecentlyPlayedMusic(10, cacheContext).catch(() => null);

  if (!data) {
    return Response.json(
      { error: "Failed to fetch recently played music" },
      {
        status: 500,
        headers: CDN_CACHE_HEADERS,
      },
    );
  }

  return Response.json(data, {
    headers: CDN_CACHE_HEADERS,
  });
}
