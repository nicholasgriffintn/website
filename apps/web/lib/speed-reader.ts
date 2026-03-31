const BLOCK_LEVEL_TAGS = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "br",
  "div",
  "figcaption",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "li",
  "main",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "td",
  "th",
  "tr",
  "ul",
]);

const HTML_ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "-",
  mdash: "-",
  hellip: "...",
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
};

function replaceEscapedWhitespace(value: string) {
  return value.replace(/\\r\\n/g, " ").replace(/\\[nrt]/g, " ");
}

function decodeHtmlEntities(value: string) {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const codePoint = Number.parseInt(entity.slice(2), 16);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }

    if (entity.startsWith("#")) {
      const codePoint = Number.parseInt(entity.slice(1), 10);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }

    return HTML_ENTITY_MAP[entity.toLowerCase()] ?? match;
  });
}

function decodeHtmlEntitiesFully(value: string) {
  let decoded = value;
  for (let index = 0; index < 2; index += 1) {
    const next = decodeHtmlEntities(decoded);
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
}

function stripHtmlTags(value: string) {
  return value
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(
      /<\/?(p|div|li|h[1-6]|section|article|ul|ol|blockquote|pre|table|tr|td|th)\b[^>]*>/gi,
      " ",
    )
    .replace(/<[^>]+>/g, " ");
}

function normalizeTextForReader(value: string) {
  return replaceEscapedWhitespace(value).replace(/\s+/g, " ").trim();
}

function stripMarkdownFormatting(value: string) {
  const cleaned = decodeHtmlEntitiesFully(
    value
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*_~>#]+/g, " "),
  );

  return normalizeTextForReader(stripHtmlTags(cleaned));
}

function collectHastText(node: unknown, collector: string[]) {
  if (!node || typeof node !== "object") return;

  const typedNode = node as {
    type?: unknown;
    value?: unknown;
    tagName?: unknown;
    children?: unknown[];
  };

  if (typedNode.type === "text" && typeof typedNode.value === "string") {
    collector.push(typedNode.value);
    return;
  }

  const tagName =
    typeof typedNode.tagName === "string" ? typedNode.tagName.toLowerCase() : undefined;
  const isBlockElement = !!tagName && BLOCK_LEVEL_TAGS.has(tagName);

  if (tagName === "script" || tagName === "style") return;

  if (isBlockElement) collector.push(" ");

  if (Array.isArray(typedNode.children)) {
    typedNode.children.forEach((child) => collectHastText(child, collector));
  }

  if (isBlockElement) collector.push(" ");
}

function extractPlainTextFromMdxTree(mdxTree: unknown) {
  const collector: string[] = [];
  collectHastText(mdxTree, collector);
  return normalizeTextForReader(collector.join(" "));
}

export function buildSpeedReaderText(description: string | null, mdxTree: unknown) {
  const descriptionText = description ? stripMarkdownFormatting(description) : "";
  const contentText = extractPlainTextFromMdxTree(mdxTree);
  return normalizeTextForReader([descriptionText, contentText].filter(Boolean).join(" "));
}
