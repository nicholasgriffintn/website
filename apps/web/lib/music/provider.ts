import { getEnvValue } from "@/lib/env";
import type { MusicWidgetProvider } from "@/types/music";

const DEFAULT_MUSIC_WIDGET_PROVIDER: MusicWidgetProvider = "apple-music";

export function getMusicWidgetProvider(): MusicWidgetProvider {
  const configuredProvider = getEnvValue("MUSIC_WIDGET_PROVIDER")?.trim().toLowerCase();

  if (!configuredProvider) {
    return DEFAULT_MUSIC_WIDGET_PROVIDER;
  }

  if (configuredProvider === "apple-music") {
    return "apple-music";
  }

  if (configuredProvider === "lastfm") {
    return "lastfm";
  }

  console.warn(
    `Unknown MUSIC_WIDGET_PROVIDER "${configuredProvider}", falling back to ${DEFAULT_MUSIC_WIDGET_PROVIDER}`,
  );
  return DEFAULT_MUSIC_WIDGET_PROVIDER;
}
