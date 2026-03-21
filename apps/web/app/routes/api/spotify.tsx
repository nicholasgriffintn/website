import { getRecentlyPlayed } from "@/lib/data/spotify";
import { CDN_CACHE_HEADERS } from "@/lib/constants";

export async function loader() {
  const data = await getRecentlyPlayed();
  return Response.json(data, {
    headers: CDN_CACHE_HEADERS,
  });
}
