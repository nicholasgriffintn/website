import { getRecentlyPlayed as getAppleMusicRecentlyPlayed } from "@/lib/apple-music/getRecentlyPlayed";
import { createWidgetStyles } from "@/lib/apple-music/artwork";
import { getRecentlyPlayed as getLastFmRecentlyPlayed } from "@/lib/lastfm/getRecentlyPlayed";
import { getMusicWidgetProvider } from "@/lib/music/provider";
import type { CacheRequestContext } from "@/lib/cache";
import type { RecentTracks as AppleMusicRecentTracks } from "@/types/apple-music";
import type { LastFmRecentTrack, LastFmRecentTracks } from "@/types/lastfm";
import type { MusicWidgetData, MusicWidgetTrack } from "@/types/music";

const LAST_FM_IMAGE_PRIORITY = ["extralarge", "large", "medium", "small"] as const;

function getAppleMusicArtworkUrl(track: AppleMusicRecentTracks[number]) {
  const artworkUrl = track.attributes.artwork.url;

  return artworkUrl ? artworkUrl.replace("{w}", "700").replace("{h}", "245") : null;
}

function normaliseAppleMusicTracks(tracks: AppleMusicRecentTracks | null): MusicWidgetData | null {
  if (!tracks?.length) {
    return null;
  }

  return {
    provider: "apple-music",
    tracks: tracks.map((track) => ({
      id: track.id,
      name: track.attributes.name,
      artistName: track.attributes.artistName,
      albumName: track.attributes.albumName,
      url: track.attributes.url,
      artworkUrl: getAppleMusicArtworkUrl(track),
      previewUrl: track.attributes.previews[0]?.url ?? null,
      isNowPlaying: false,
    })),
    style: createWidgetStyles(tracks[0]?.attributes.artwork),
  };
}

function getLastFmArtworkUrl(track: LastFmRecentTrack) {
  for (const size of LAST_FM_IMAGE_PRIORITY) {
    const image = track.image.find((candidate) => candidate.size === size)?.["#text"];

    if (image) {
      return image;
    }
  }

  return track.image.find((candidate) => candidate["#text"])?.["#text"] ?? null;
}

function getLastFmTrackId(track: LastFmRecentTrack, index: number) {
  if (track.mbid) {
    return track.mbid;
  }

  const timestamp = track.date?.uts ?? (track["@attr"]?.nowplaying === "true" ? "now" : index);
  return `${track.artist["#text"]}-${track.name}-${timestamp}`;
}

function normaliseLastFmTracks(data: LastFmRecentTracks | null): MusicWidgetData | null {
  const tracks = data?.recenttracks.track;

  if (!tracks?.length) {
    return null;
  }

  return {
    provider: "lastfm",
    tracks: tracks.map<MusicWidgetTrack>((track, index) => ({
      id: getLastFmTrackId(track, index),
      name: track.name,
      artistName: track.artist["#text"],
      albumName: track.album["#text"],
      url: track.url || null,
      artworkUrl: getLastFmArtworkUrl(track),
      previewUrl: null,
      isNowPlaying: track["@attr"]?.nowplaying === "true",
    })),
  };
}

export async function getRecentlyPlayedMusic(
  limit = 10,
  cacheContext?: CacheRequestContext,
): Promise<MusicWidgetData | null> {
  const provider = getMusicWidgetProvider();

  if (provider === "lastfm") {
    const musicData = await getLastFmRecentlyPlayed(limit, cacheContext);
    return normaliseLastFmTracks(musicData);
  }

  const musicData = await getAppleMusicRecentlyPlayed(limit, cacheContext);
  return normaliseAppleMusicTracks(musicData);
}
