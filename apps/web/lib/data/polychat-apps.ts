export type PolychatAppCategory =
  | "Text"
  | "Media"
  | "Productivity"
  | "AI Generation"
  | "Code Assistance";

export type PolychatApp = {
  title: string;
  category: PolychatAppCategory;
  description: string;
  featured?: boolean;
  href: string;
};

const POLYCHAT_BASE_URL = "https://polychat.app/apps";

export const polychatApps: PolychatApp[] = [
  {
    title: "Article Processor",
    category: "Text",
    description: "Analyse and summarise articles to get insights and summaries.",
    featured: true,
    href: POLYCHAT_BASE_URL,
  },
  {
    title: "Drawing",
    category: "Media",
    description: "Create drawings and get AI to enhance them or guess what they are.",
    href: POLYCHAT_BASE_URL,
  },
  {
    title: "Note Taker",
    category: "Productivity",
    description: "Take notes and save them for later.",
    href: POLYCHAT_BASE_URL,
  },
  {
    title: "Podcast Processor",
    category: "Media",
    description: "Upload and process your podcast to get transcription, summary, and cover image.",
    href: POLYCHAT_BASE_URL,
  },
  {
    title: "Replicate Predictions",
    category: "AI Generation",
    description: "Generate images, videos, audio, and more with state-of-the-art AI models.",
    href: POLYCHAT_BASE_URL,
  },
  {
    title: "Sandbox Worker",
    category: "Code Assistance",
    description:
      "Connect GitHub repositories and run streamed implementation tasks in isolated sandboxes.",
    href: POLYCHAT_BASE_URL,
  },
  {
    title: "Strudel Music Patterns",
    category: "AI Generation",
    description:
      "Create and generate music patterns with AI using Strudel's code-based music creation tool.",
    href: POLYCHAT_BASE_URL,
  },
];

export const featuredPolychatApps = polychatApps.filter((app) => app.featured);
