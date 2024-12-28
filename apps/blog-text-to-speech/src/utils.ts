export function parseFrontmatter(fileContent: string): {
  content: string;
  metadata: Record<string, string | string[]>;
} {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);
  if (!match) {
    throw new Error('No frontmatter block found');
  }

  const content = fileContent.replace(frontmatterRegex, '').trim();

  const frontMatterBlock = match[1];
  const metadata = frontMatterBlock
    ?.split('\n')
    .reduce<Record<string, string | string[]>>((acc, line) => {
      const [key, ...valueArr] = line.split(': ');
      if (key) {
        acc[key.trim()] = valueArr.join(': ').trim();
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
    return '';
  }

  console.log('Initial content:', markdownContent);

  const PAUSE_LENGTHS = {
    SHORT: '300ms',
    MEDIUM: '800ms',
    LONG: '1000ms',
  };

  let content = markdownContent;

  const transformations: Transformation[] = [
    // Remove markdown links while preserving text
    {
      pattern: /\[([^\]]+)\]\([^)]+\)/g,
      replacement: '$1',
    },
    // Convert images to descriptive text
    {
      pattern: /!\[([^\]]*)\]\([^)]*\)/g,
      replacement: (_match: string, alt: string) =>
        alt ? `Image: ${alt}` : '',
    },
    // Remove code blocks
    {
      pattern: /```[\s\S]*?```/g,
      replacement: 'Please view the code block in the browser.',
    },
    // Replacce inline code
    {
      pattern: /`([^`]*)`/g,
      replacement: '$1',
    },
    // Convert headers to emphasized text with pauses
    {
      pattern: /#{1,6}\s*(.*)/g,
      replacement: (_match: string, header: string) =>
        `<break time="${
          PAUSE_LENGTHS.LONG
        }"/><emphasis level="strong">${header.trim()}</emphasis><break time="${
          PAUSE_LENGTHS.MEDIUM
        }"/>`,
    },
    // Look for multiple newlines with optional spaces
    {
      pattern: /\n\s*\n/g,
      replacement: `<break time="${PAUSE_LENGTHS.MEDIUM}"/>`,
    },
    // Add pause after end of sentences
    {
      pattern: /\.\s+/g,
      replacement: `. <break time="${PAUSE_LENGTHS.SHORT}"/>`,
    },
    // Convert bullet points to spoken format
    {
      pattern: /^\s*[-*]\s/gm,
      replacement: `<break time="${PAUSE_LENGTHS.SHORT}"/> `,
    },
    // Handle numbered lists
    {
      pattern: /^\s*\d+\.\s/gm,
      replacement: `<break time="${PAUSE_LENGTHS.SHORT}"/> `,
    },
    // Convert emphasis markers (* and _) to SSML
    {
      pattern: /(\*\*|__)(.*?)\1/g,
      replacement: (_match: string, _marker: string, text: string) =>
        `<emphasis level="strong">${text.trim()}</emphasis>`,
    },
    {
      pattern: /(\*|_)(.*?)\1/g,
      replacement: (_match: string, _marker: string, text: string) =>
        `<emphasis level="moderate">${text.trim()}</emphasis>`,
    },
    {
      pattern: /some-pattern/g,
      replacement: (_match: string, _marker: string, text: string) =>
        `<emphasis level="moderate">${text.trim()}</emphasis>`,
    },
  ];

  transformations.forEach(({ pattern, replacement }) => {
    content = content.replace(
      pattern,
      replacement as string & ((substring: string, ...args: any[]) => string)
    );

    console.log('After transformation:', content);
  });

  content = content
    // Replace new lines
    .replace(/\\n/g, `<break time="${PAUSE_LENGTHS.MEDIUM}"/>`)
    // Remove URLs
    .replace(/https?:\/\/[^\s<]+/g, '')
    // Replace HTML entities
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, 'and')
    .replace(/&lt;/g, 'less than')
    .replace(/&gt;/g, 'greater than')
    // Remove markdown tables
    .replace(/\|.*\|/g, '')
    .replace(/[-|]+/g, '')
    // Remove any non-SSML tags
    .replace(/<(?!\/?(break|emphasis|speak)\b)[^>]+>/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove any remaining markdown symbols
    .replace(/[#*_~`]/g, '')
    // Clean up any double breaks
    .replace(/(<break[^>]+>\s*){2,}/g, '<break time="1000ms"/>');

  console.log('Final content:', content);

  content = content
    // Remove any non-SSML brackets that might remain
    .replace(/<(?!\/?(break|emphasis|speak)\b)[^>]+>/g, '')
    // Clean up any empty emphasis tags
    .replace(/<emphasis level="[^"]*">\s*<\/emphasis>/g, '');

  // Verify all emphasis tags are properly closed
  const emphasisOpenCount = (content.match(/<emphasis/g) || []).length;
  const emphasisCloseCount = (content.match(/<\/emphasis>/g) || []).length;
  if (emphasisOpenCount !== emphasisCloseCount) {
    content = content
      .replace(/<emphasis[^>]*>/g, '')
      .replace(/<\/emphasis>/g, '');
  }

  console.log(content);

  return `<speak>${content}</speak>`;
}
