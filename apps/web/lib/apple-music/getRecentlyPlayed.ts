import { getEnvValue } from "@/lib/env";

const userToken = getEnvValue("APPLE_MUSIC_USER_TOKEN");
const musicKitToken = getEnvValue("APPLE_MUSIC_MUSICKIT_TOKEN");

export async function getRecentlyPlayed(limit = 10) {
  if (!userToken) {
    console.error("Missing Apple Music user token in environment variables");
    return null;
  }

  if (!musicKitToken) {
    console.error("Missing Apple Music MusicKit token in environment variables");
    return null;
  }

  const response = await fetch(
    `https://api.music.apple.com/v1/me/recent/played/tracks?limit=${limit}`,
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
}
