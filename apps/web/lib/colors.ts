export function hexToRgb(
  hex: string
): { r: number; g: number; b: number; alpha?: number } | null {
  const normalized = hex.replace('#', '');

  if (normalized.length === 3 || normalized.length === 4) {
    if (!normalized[0] || !normalized[1] || !normalized[2] || !normalized[3]) {
      return null;
    }
    const r = Number.parseInt(normalized[0] + normalized[0], 16);
    const g = Number.parseInt(normalized[1] + normalized[1], 16);
    const b = Number.parseInt(normalized[2] + normalized[2], 16);
    const alpha =
      normalized.length === 4
        ? Number.parseInt(normalized[3] + normalized[3], 16) / 255
        : undefined;

    return { r, g, b, alpha };
  }

  if (normalized.length === 6 || normalized.length === 8) {
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    const alpha =
      normalized.length === 8
        ? Number.parseInt(normalized.slice(6, 8), 16) / 255
        : undefined;

    return { r, g, b, alpha };
  }

  return null;
}

export function toRgbaString(hex: string, alphaOverride = 1): string {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return hex;
  }

  const alpha = Math.min(
    1,
    Math.max(
      0,
      (rgb.alpha ?? 1) * (Number.isFinite(alphaOverride) ? alphaOverride : 1)
    )
  );
  const roundedAlpha = Math.round(alpha * 1000) / 1000;

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${roundedAlpha})`;
}

function srgbToLinear(value: number): number {
  const normalized = value / 255;

  if (normalized <= 0.04045) {
    return normalized / 12.92;
  }

  return ((normalized + 0.055) / 1.055) ** 2.4;
}

export function getRelativeLuminance(hex: string): number | null {
  const sanitized = sanitizeHexColor(hex);
  const rgb = sanitized ? hexToRgb(sanitized) : null;

  if (!rgb) {
    return null;
  }

  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(
  colorA: string,
  colorB: string
): number | null {
  const luminanceA = getRelativeLuminance(colorA);
  const luminanceB = getRelativeLuminance(colorB);

  if (luminanceA === null || luminanceB === null) {
    return null;
  }

  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  const ratio = (lighter + 0.05) / (darker + 0.05);

  return Math.round(ratio * 100) / 100;
}

export function ensureAccessibleTextColor(
  candidate: string | null | undefined,
  background: string | null | undefined,
  options: { minContrast?: number } = {}
): string | null {
  const sanitizedCandidate = sanitizeHexColor(candidate ?? null);
  const sanitizedBackground = sanitizeHexColor(background ?? null);

  if (!sanitizedBackground) {
    return sanitizedCandidate;
  }

  const minContrast = options.minContrast ?? 4.5;
  const palette = new Set<string>();

  if (sanitizedCandidate) {
    palette.add(sanitizedCandidate);
  }

  palette.add('#ffffff');
  palette.add('#000000');

  let fallback: string | null = sanitizedCandidate ?? null;
  let bestRatio = fallback
    ? getContrastRatio(fallback, sanitizedBackground) ?? 0
    : 0;

  for (const color of palette) {
    const ratio = getContrastRatio(color, sanitizedBackground);

    if (ratio !== null && ratio >= minContrast) {
      return color;
    }

    if (ratio !== null && ratio > bestRatio) {
      bestRatio = ratio;
      fallback = color;
    }
  }

  return fallback;
}

export function sanitizeHexColor(color?: string | null): string | null {
  if (!color) {
    return null;
  }

  const trimmed = color.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}
