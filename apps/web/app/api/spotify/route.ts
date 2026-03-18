import { getRecentlyPlayed } from "@/lib/data/spotify";

export const runtime = "edge";

export async function GET() {
  const data = await getRecentlyPlayed();

  return Response.json(data, {
    headers: {
      "Cache-Control": "s-maxage=180000",
    },
  });
}
