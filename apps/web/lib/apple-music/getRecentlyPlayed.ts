import { getEnvValue } from "@/lib/env";
import { CacheManager } from "@/lib/cache";

const userToken = getEnvValue("APPLE_MUSIC_USER_TOKEN");
const musicKitToken = getEnvValue("APPLE_MUSIC_MUSICKIT_TOKEN");
const recentlyPlayedCache = new CacheManager<unknown>({ duration: 5 * 60 * 1000, maxEntries: 20 });

export async function getRecentlyPlayed(limit = 10) {
  if (!userToken) {
    console.error("Missing Apple Music user token in environment variables");
    return null;
  }

  if (!musicKitToken) {
    console.error("Missing Apple Music MusicKit token in environment variables");
    return null;
  }

  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(25, Math.floor(limit))) : 10;
  const cacheKey = `apple_recent_${safeLimit}`;

  return recentlyPlayedCache.upsert(cacheKey, async () => {
    const response = await fetch(
      `https://api.music.apple.com/v1/me/recent/played/tracks?limit=${safeLimit}`,
      {
        headers: {
          Authorization: `Bearer ${musicKitToken}`,
          "Music-User-Token": userToken,
        },
      },
    );

    if (!response.ok) {
      console.error(`Apple Music API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.data;
  });
}
