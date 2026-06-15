import { CacheManager } from "@/lib/cache";
import type { CacheRequestContext } from "@/lib/cache";
import { getEnvValue } from "@/lib/env";
import { parsePositiveIntegerInRange } from "@/lib/numbers";
import type { LastFmRecentTracks } from "@/types/lastfm";

const lastFmCache = new CacheManager<LastFmRecentTracks | null>({
  duration: 5 * 60 * 1000,
  maxEntries: 20,
  namespace: "lastfm-api",
});

export async function getRecentlyPlayed(
  limit = 10,
  cacheContext?: CacheRequestContext,
): Promise<LastFmRecentTracks | null> {
  const lastFmToken = getEnvValue("LAST_FM_TOKEN");

  if (!lastFmToken) {
    console.error("Missing Last.fm token in environment variables");
    return null;
  }

  const safeLimit = parsePositiveIntegerInRange(limit, {
    min: 1,
    max: 200,
    fallback: 10,
  });
  const searchParams = new URLSearchParams({
    method: "user.getrecenttracks",
    user: "NGriiffin",
    api_key: lastFmToken,
    limit: String(safeLimit),
    format: "json",
  });

  return lastFmCache.upsert(
    `recent_tracks_${safeLimit}`,
    async () => {
      const response = await fetch(`https://ws.audioscrobbler.com/2.0/?${searchParams}`, {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "NGWeb",
        },
      });

      if (!response.ok) {
        console.error("Last.fm API error", response.status, response.statusText);
        return null;
      }

      return (await response.json()) as LastFmRecentTracks;
    },
    cacheContext,
  );
}
