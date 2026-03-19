import type { LoaderFunctionArgs } from "react-router";

import { getGitHubRepos } from "@/lib/data/github";

export async function loader({ request }: LoaderFunctionArgs) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 8;
  const cursor = searchParams.get("cursor") || undefined;
  const data = await getGitHubRepos({ limit, cursor });
  return Response.json(data, {
    headers: { "Cache-Control": "s-maxage=180000" },
  });
}
