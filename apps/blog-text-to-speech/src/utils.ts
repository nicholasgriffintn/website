export function parseFrontmatter(fileContent: string): {
  content: string;
  metadata: Record<string, string | string[]>;
} {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);
  if (!match) {
    throw new Error("No frontmatter block found");
  }

  const content = fileContent.replace(frontmatterRegex, "").trim();

  const frontMatterBlock = match[1];
  const metadata = frontMatterBlock
    ?.split("\n")
    .reduce<Record<string, string | string[]>>((acc, line) => {
      const [key, ...valueArr] = line.split(": ");
      if (key) {
        acc[key.trim()] = valueArr.join(": ").trim();
      }
      return acc;
    }, {});

  return {
    content,
    metadata,
  };
}

interface FormatContentOptions {
  markupProfile?: "plain" | "cartesia" | "elevenlabs";
  supportsBreakTags?: boolean;
  paragraphBreakMs?: number;
}

const CARTESIA_SSML_TAGS = ["speed", "volume", "emotion", "break", "spell"] as const;
const ELEVENLABS_SSML_TAGS = ["break", "phoneme"] as const;

function getSupportedMarkupTags(
  profile: NonNullable<FormatContentOptions["markupProfile"]>,
  supportsBreakTags: boolean,
): string[] {
  if (profile === "cartesia") {
    return [...CARTESIA_SSML_TAGS];
  }

  if (profile === "elevenlabs") {
    if (supportsBreakTags) {
      return [...ELEVENLABS_SSML_TAGS];
    }
    return ["phoneme"];
  }

  return [];
}

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "and")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
}

function normalisePunctuation(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed === "..." || trimmed.endsWith("...")) {
    return trimmed;
  }

  if (/^<[^>]+>$/.test(trimmed)) {
    return trimmed;
  }

  if (/[.!?]$/.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}.`;
}

function cleanInlineMarkdown(
  line: string,
  profile: NonNullable<FormatContentOptions["markupProfile"]>,
  supportsBreakTags: boolean,
): string {
  let value = line;

  value = decodeEntities(value);

  value = value
    // Remove markdown links while preserving text.
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Convert images to descriptive text.
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, (_match: string, alt: string) =>
      alt ? `Image: ${alt}` : "",
    )
    // Remove inline code markers.
    .replace(/`([^`]*)`/g, "$1")
    // Strip bold/italic/strikethrough markers.
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    // Remove standalone URLs.
    .replace(/\bhttps?:\/\/[^\s<]+/g, "")
    // Remove remaining markdown control symbols.
    .replace(/[#*_~]/g, "")
    .trim();

  if (profile === "elevenlabs" && !supportsBreakTags) {
    value = value.replace(/<break\b[^>]*\/?>/gi, " ... ");
  }

  const supportedTags = getSupportedMarkupTags(profile, supportsBreakTags);

  if (supportedTags.length === 0) {
    return value
      .replace(/<[^>]+>/g, "")
      .replace(/[<>]/g, "")
      .trim();
  }

  const tokens = new Map<string, string>();
  let tokenIndex = 0;
  const ssmlRegex = new RegExp(`<\\/?(?:${supportedTags.join("|")})\\b[^>]*\\/?>`, "gi");

  value = value.replace(ssmlRegex, (tag) => {
    const token = `__SSML_TOKEN_${tokenIndex}__`;
    tokenIndex += 1;
    tokens.set(token, tag);
    return token;
  });

  value = value.replace(/<[^>]+>/g, "");

  for (const [token, tag] of tokens.entries()) {
    value = value.replace(token, tag);
  }

  return value.trim();
}

function normaliseLines(
  markdownContent: string,
  profile: NonNullable<FormatContentOptions["markupProfile"]>,
  supportsBreakTags: boolean,
): string[] {
  const lines = markdownContent.replace(/\r\n/g, "\n").split("\n");
  const normalised: string[] = [];
  let inCodeBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      if (!inCodeBlock) {
        normalised.push("Code example omitted. Please view it in the article.");
      }
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    if (!line) {
      normalised.push("");
      continue;
    }

    if (/^[-*_]{3,}$/.test(line)) {
      normalised.push("");
      continue;
    }

    if (/^#{1,6}\s+/.test(line)) {
      const heading = cleanInlineMarkdown(
        line.replace(/^#{1,6}\s+/, ""),
        profile,
        supportsBreakTags,
      );
      if (heading) {
        normalised.push(normalisePunctuation(heading));
      }
      continue;
    }

    if (/^\s*>/.test(rawLine)) {
      const quote = cleanInlineMarkdown(
        rawLine.replace(/^\s*>\s?/, ""),
        profile,
        supportsBreakTags,
      );
      if (quote) {
        normalised.push(normalisePunctuation(`Quote: ${quote}`));
      }
      continue;
    }

    if (/^\s*[-*+]\s+/.test(rawLine)) {
      const item = cleanInlineMarkdown(
        rawLine.replace(/^\s*[-*+]\s+/, ""),
        profile,
        supportsBreakTags,
      );
      if (item) {
        normalised.push(normalisePunctuation(`List item: ${item}`));
      }
      continue;
    }

    if (/^\s*\d+\.\s+/.test(rawLine)) {
      const item = cleanInlineMarkdown(
        rawLine.replace(/^\s*\d+\.\s+/, ""),
        profile,
        supportsBreakTags,
      );
      if (item) {
        normalised.push(normalisePunctuation(`List item: ${item}`));
      }
      continue;
    }

    if (line.startsWith("|") && /\|/.test(line.slice(1))) {
      if (/^\|?[\s:-]+\|[\s|:-]*$/.test(line)) {
        continue;
      }

      const row = line
        .split("|")
        .map((cell) => cleanInlineMarkdown(cell, profile, supportsBreakTags))
        .filter(Boolean)
        .join(", ");

      if (row) {
        normalised.push(normalisePunctuation(row));
      }
      continue;
    }

    const cleaned = cleanInlineMarkdown(line, profile, supportsBreakTags);
    if (cleaned) {
      normalised.push(normalisePunctuation(cleaned));
    }
  }

  return normalised;
}

export function formatContentForSpeech(
  markdownContent: string,
  options: FormatContentOptions = {},
): string {
  if (!markdownContent?.trim()) {
    return "";
  }

  const markupProfile = options.markupProfile ?? "plain";
  const supportsBreakTags = options.supportsBreakTags ?? markupProfile === "cartesia";
  const paragraphBreakMs = options.paragraphBreakMs ?? 700;
  const lines = normaliseLines(markdownContent, markupProfile, supportsBreakTags);

  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];

  for (const line of lines) {
    if (!line) {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(" "));
        currentParagraph = [];
      }
      continue;
    }
    currentParagraph.push(line);
  }

  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(" "));
  }

  if (paragraphs.length === 0) {
    return "";
  }

  if (supportsBreakTags && (markupProfile === "cartesia" || markupProfile === "elevenlabs")) {
    const breakTag = `<break time="${Math.max(100, paragraphBreakMs)}ms"/>`;
    return paragraphs.join(` ${breakTag} `).replace(/\s+/g, " ").trim();
  }

  if (markupProfile === "elevenlabs") {
    return paragraphs.join(" ... ").replace(/\s+/g, " ").trim();
  }

  return paragraphs.join(" ").replace(/\s+/g, " ").trim();
}
