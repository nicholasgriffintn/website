export type Project = {
  name: string;
  description: string;
  url?: string;
  links?: {
    title: string;
    url: string;
  }[];
  image?: string;
  imageAlt?: string;
};

export type Projects = Project[];
