import { getRecentlyPlayed } from "@/lib/apple-music/getRecentlyPlayed";

export async function loader() {
  const data = await getRecentlyPlayed();
  return Response.json(data, {
    headers: { "Cache-Control": "s-maxage=180000" },
  });
}
