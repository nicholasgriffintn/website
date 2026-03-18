import { getGitHubRepos } from "@/lib/data/github";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 8;
  const cursor = searchParams.get("cursor") || undefined;

  const data = await getGitHubRepos({
    limit,
    cursor,
  });

  return Response.json(data, {
    headers: {
      "Cache-Control": "s-maxage=180000",
    },
  });
}
