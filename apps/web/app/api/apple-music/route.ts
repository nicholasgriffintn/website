import { getRecentlyPlayed } from '@/lib/apple-music/getRecentlyPlayed';

export const runtime = 'edge';

export async function GET() {
  const data = await getRecentlyPlayed();

  return Response.json(data, {
    headers: {
      'Cache-Control': 's-maxage=180000',
    },
  });
}
