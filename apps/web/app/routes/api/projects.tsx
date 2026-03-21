import { getProjects } from "@/lib/data/projects";
import { CDN_CACHE_HEADERS } from "@/lib/constants";

export async function loader() {
  const data = await getProjects();
  return Response.json(data, {
    headers: CDN_CACHE_HEADERS,
  });
}
