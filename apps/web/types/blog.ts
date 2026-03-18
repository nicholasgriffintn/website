export type Metadata = {
  title: string;
  date: string;
  description: string;
  image_url?: string;
  image_alt?: string;
  tags?: string[];
  draft?: boolean;
  archived?: boolean;
  audio_url?: string;
  metadata: {
    link?: string;
    hideFeaturedImage?: boolean;
    hideAudio?: boolean;
  };
};

export interface Heading {
  text: string;
  level: number;
  slug: string;
}
