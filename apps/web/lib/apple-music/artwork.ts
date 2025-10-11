import { CSSProperties } from 'react';

import {
  ensureAccessibleTextColor,
  sanitizeHexColor,
  toRgbaString,
} from '../colors';
import type { RecentTracks } from '../../types/apple-music';

type Artwork = RecentTracks[number]['attributes']['artwork'];

export function getArtworkColor(
  artwork: Artwork | null | undefined,
  ...keys
): string | null {
  if (!artwork) {
    return null;
  }

  for (const key of keys) {
    const value = artwork[key];
    const sanitized = sanitizeHexColor(value ?? null);

    if (sanitized) {
      return sanitized;
    }
  }

  return null;
}

export function createWidgetStyles(
  artwork?: Artwork | null
): CSSProperties | undefined {
  if (!artwork) {
    return undefined;
  }

  const bg = getArtworkColor(artwork, 'bgColour', 'bgColor');
  const text1 = getArtworkColor(artwork, 'textColour1', 'textColor1');
  const text2 = getArtworkColor(artwork, 'textColour2', 'textColor2');
  const text3 = getArtworkColor(artwork, 'textColour3', 'textColor3');
  const text4 = getArtworkColor(artwork, 'textColour4', 'textColor4');

  const backgroundStyles = bg
    ? {
        '--am-widget-background': `linear-gradient(135deg, ${toRgbaString(
          bg,
          0.75
        )} 0%, ${toRgbaString(bg, 0.45)} 100%)`,
        '--am-overlay-background': `linear-gradient(180deg, ${toRgbaString(
          bg,
          0.9
        )} 0%, ${toRgbaString(bg, 0.65)} 100%)`,
        '--am-track-background': toRgbaString(bg, 0.25),
        '--am-track-background-hover': toRgbaString(bg, 0.35),
        '--am-border-color': toRgbaString(bg, 0.5),
      }
    : {};

  const textTokens: Array<[string, string | null]> = [
    ['--am-text-primary', text1],
    ['--am-text-secondary', text2],
    ['--am-text-tertiary', text3],
    ['--am-text-accent', text4],
  ];

  const textStyles = textTokens.reduce<Record<string, string>>(
    (acc, [token, color]) => {
      const accessible = ensureAccessibleTextColor(color, bg);

      if (accessible) {
        acc[token] = accessible;
      }

      return acc;
    },
    {}
  );

  const styles = { ...backgroundStyles, ...textStyles };

  return Object.keys(styles).length > 0 ? (styles as CSSProperties) : undefined;
}
