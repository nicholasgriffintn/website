import { getGitHubGists } from "@/lib/data/github";

export async function loader() {
  const data = await getGitHubGists();
  return Response.json(data, {
    headers: { "Cache-Control": "s-maxage=180000" },
  });
}
