import { getGitHubGists } from "@/lib/data/github";
import { CDN_CACHE_HEADERS } from "@/lib/constants";

export async function loader() {
  const data = await getGitHubGists();
  return Response.json(data, {
    headers: CDN_CACHE_HEADERS,
  });
}
