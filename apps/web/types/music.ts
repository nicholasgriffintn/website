import type { CSSProperties } from "react";

export type MusicWidgetProvider = "apple-music" | "lastfm";

export type MusicWidgetTrack = {
  id: string;
  name: string;
  artistName: string;
  albumName: string;
  url: string | null;
  artworkUrl: string | null;
  previewUrl: string | null;
  isNowPlaying: boolean;
};

export type MusicWidgetStyleArtwork = {
  bgColor?: string | null;
  bgColour?: string | null;
  textColor1?: string | null;
  textColour1?: string | null;
  textColor2?: string | null;
  textColour2?: string | null;
  textColor3?: string | null;
  textColour3?: string | null;
  textColor4?: string | null;
  textColour4?: string | null;
};

export type MusicWidgetData = {
  provider: MusicWidgetProvider;
  tracks: MusicWidgetTrack[];
  style?: CSSProperties;
};
