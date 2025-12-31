const userToken = process.env.APPLE_MUSIC_USER_TOKEN as string;
const musicKitToken = process.env.APPLE_MUSIC_MUSICKIT_TOKEN as string;

export async function getRecentlyPlayed(limit = 10) {
  if (!userToken) {
    console.error('Missing Apple Music user token in environment variables');
    return null;
  }

  if (!musicKitToken) {
    console.error(
      'Missing Apple Music MusicKit token in environment variables'
    );
    return null;
  }

  const response = await fetch(
    `https://api.music.apple.com/v1/me/recent/played/tracks?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${musicKitToken}`,
        'Music-User-Token': userToken,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}
