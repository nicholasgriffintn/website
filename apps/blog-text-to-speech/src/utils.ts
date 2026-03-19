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

interface Transformation {
  pattern: RegExp;
  replacement: string | ((match: string, ...args: string[]) => string);
}

export function formatContentForSpeech(markdownContent: string): string {
  if (!markdownContent?.trim()) {
    return "";
  }

  let content = markdownContent;

  const transformations: Transformation[] = [
    // Remove markdown links while preserving text
    {
      pattern: /\[([^\]]+)\]\([^)]+\)/g,
      replacement: "$1",
    },
    // Convert images to descriptive text
    {
      pattern: /!\[([^\]]*)\]\([^)]*\)/g,
      replacement: (_match: string, alt: string) => (alt ? `Image: ${alt}` : ""),
    },
    // Remove code blocks
    {
      pattern: /```[\s\S]*?```/g,
      replacement: "Please view the code block in the browser.",
    },
    // Replace inline code
    {
      pattern: /`([^`]*)`/g,
      replacement: "$1",
    },
    // Convert headers to plain text with surrounding newlines
    {
      pattern: /#{1,6}\s*(.*)/g,
      replacement: (_match: string, header: string) => `\n\n${header.trim()}\n\n`,
    },
    // Strip bold markers, preserve text
    {
      pattern: /(\*\*|__)(.*?)\1/g,
      replacement: (_match: string, _marker: string, text: string) => text.trim(),
    },
    // Strip italic markers, preserve text
    {
      pattern: /(\*|_)(.*?)\1/g,
      replacement: (_match: string, _marker: string, text: string) => text.trim(),
    },
  ];

  transformations.forEach(({ pattern, replacement }) => {
    content = content.replace(
      pattern,
      typeof replacement === "function" ? replacement : (_match: string) => replacement as string,
    );
  });

  content = content
    // Remove URLs
    .replace(/\bhttps?:\/\/[^\s<]+/g, "")
    // Replace HTML entities
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "and")
    .replace(/&lt;/g, "less than")
    .replace(/&gt;/g, "greater than")
    // Remove markdown tables while preserving content
    .replace(/\|([^|\n]+)\|/g, "$1")
    .replace(/[-|]+/g, "")
    // Remove any remaining markdown symbols
    .replace(/[#*_~`]/g, "")
    // Remove any HTML tags
    .replace(/<[^>]+>/g, "")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();

  return content;
}
