import type { RecentTracks } from "@/types/spotify";
import { getEnvValue } from "@/lib/env";
import { CacheManager } from "@/lib/cache";

const spotifyCache = new CacheManager<unknown>({ duration: 5 * 60 * 1000, maxEntries: 20 });

export async function getRecentlyPlayed(): Promise<RecentTracks | undefined> {
  const lastFmToken = getEnvValue("LAST_FM_TOKEN");

  if (!lastFmToken) {
    console.error("No LastFM token found");
    return undefined;
  }

  return spotifyCache.upsert("spotify_recent_tracks", async () => {
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=NGriiffin&api_key=${lastFmToken}&limit=10&format=json`,
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "NGWeb",
        },
      },
    );

    if (!res.ok) {
      console.error("Error fetching data from Audioscrobbler", res.statusText);
      return undefined;
    }

    const data = await res.json();

    return data as RecentTracks;
  });
}
