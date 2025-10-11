export type RecentTracks = {
  id: string;
  type: 'songs';
  href: string;
  attributes: {
    albumName: string;
    artistName: string;
    artwork: {
      bgColor?: string | null;
      height: number;
      textColor1?: string | null;
      textColor2?: string | null;
      textColor3?: string | null;
      textColor4?: string | null;
      url: string;
      width: number;
    };
    contentRating: string | null;
    composerName: string | null;
    discNumber: number;
    durationInMillis: number;
    genreNames: string[];
    hasLyrics: boolean;
    isAppleDigitalMaster: boolean;
    issrc: string;
    name: string;
    playParams: {
      id: string;
      kind: 'song';
    };
    previews: {
      url: string;
    }[];
    releaseDate: string;
    trackNumber: number;
    url: string;
  };
}[];
