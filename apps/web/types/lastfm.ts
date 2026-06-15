export type LastFmRecentTracks = {
  recenttracks: {
    track: LastFmRecentTrack[];
  };
};

export type LastFmRecentTrack = {
  mbid: string;
  name: string;
  artist: {
    mbid: string;
    "#text": string;
  };
  streamable: string;
  album: {
    mbid: string;
    "#text": string;
  };
  url: string;
  image: {
    size: string;
    "#text": string;
  }[];
  "@attr"?: {
    nowplaying?: string;
  };
  date?: {
    uts: string;
    "#text": string;
  };
};
