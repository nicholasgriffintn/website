import { getGitHubGists } from "@/lib/data/github";

export const runtime = "edge";

export async function GET() {
  const data = await getGitHubGists();

  return Response.json(data, {
    headers: {
      "Cache-Control": "s-maxage=180000",
    },
  });
}
