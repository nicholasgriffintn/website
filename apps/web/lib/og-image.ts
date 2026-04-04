import { SITE_NAME } from "@/lib/seo";
import { truncateMarkdownPreview } from "@/lib/markdown";

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

const MAX_OG_TITLE_LENGTH = 140;
const MAX_TITLE_LINES = 4;
const MAX_LINE_CHARACTERS = 34;

function escapeForSvg(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildTitleLines(title: string) {
  const words = title.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length > MAX_LINE_CHARACTERS && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length <= MAX_TITLE_LINES) {
    return lines;
  }

  const trimmed = lines.slice(0, MAX_TITLE_LINES);
  const lastIndex = trimmed.length - 1;
  if (lastIndex >= 0) {
    trimmed[lastIndex] = truncateMarkdownPreview(trimmed[lastIndex] ?? "", 30);
  }
  return trimmed;
}

export function createOgImageSvg(rawTitle: string) {
  const normalisedTitle = rawTitle.replace(/\s+/g, " ").trim() || SITE_NAME;
  const title = truncateMarkdownPreview(normalisedTitle, MAX_OG_TITLE_LENGTH);
  const titleLines = buildTitleLines(title);

  const titleStartY = 224;
  const titleLineHeight = 80;
  const titleSvg = titleLines
    .map((line, index) => {
      const y = titleStartY + index * titleLineHeight;
      return `<text x="72" y="${y}" font-size="64" font-weight="700" fill="#f8fafc" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">${escapeForSvg(
        line,
      )}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_IMAGE_WIDTH}" height="${OG_IMAGE_HEIGHT}" viewBox="0 0 ${OG_IMAGE_WIDTH} ${OG_IMAGE_HEIGHT}" role="img" aria-label="Open Graph image for ${escapeForSvg(
    title,
  )}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b0f1a" />
      <stop offset="100%" stop-color="#111827" />
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0" />
      <stop offset="50%" stop-color="#1e293b" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)" />
  <rect x="0" y="0" width="1200" height="630" fill="url(#glow)" opacity="0.55" />
  <text x="72" y="112" font-size="28" font-weight="500" fill="#94a3b8" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">nicholasgriffin.dev</text>
  ${titleSvg}
  <text x="72" y="574" font-size="34" font-weight="600" fill="#cbd5e1" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">${SITE_NAME}</text>
</svg>`;
}
