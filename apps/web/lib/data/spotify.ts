import type { RecentTracks } from "@/types/spotify";
import { getEnvValue } from "@/lib/env";

export async function getRecentlyPlayed(): Promise<RecentTracks | undefined> {
  const lastFmToken = getEnvValue("LAST_FM_TOKEN");

  if (!lastFmToken) {
    console.error("No LastFM token found");
    return undefined;
  }

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
    return;
  }

  const data = await res.json();

  return data as RecentTracks;
}
