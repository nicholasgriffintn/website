import { createElement } from "react";

export function parseMarkdown(input: string, muted = false, classNames: { p?: string } = {}) {
  if (!input) return input;

  const escapeHTML = (str: string) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const linkClassName = `underline text-${
    muted ? "muted" : "primary"
  }-foreground inline font-bold p-0 transition-colors hover:underline hover:outline-none decoration-1 decoration-skip-ink-none underline-offset-[0.25em] hover:decoration-2`;

  // Pre-process code blocks to protect their content
  const codeBlocks: string[] = [];
  input = input.replace(/```([\s\S]*?)```/g, (match, code) => {
    codeBlocks.push(code);
    return `{{CODEBLOCK${codeBlocks.length - 1}}}`;
  });

  // Pre-process inline code to protect their content
  const inlineCode: string[] = [];
  input = input.replace(/`([^`]+)`/g, (match, code) => {
    inlineCode.push(code);
    return `{{INLINECODE${inlineCode.length - 1}}}`;
  });

  let html = input
    .replace(/\\\\/g, "\\")
    .replace(/\\n/g, "\n")
    .replace(/<summary>/g, "**Summary:** ")
    .replace(/<\/summary>/g, "")
    .replace(/<questions>/g, "**Questions:** ")
    .replace(/<\/questions>/g, "")
    .replace(/<question>/g, "")
    .replace(/<\/question>/g, "")
    .replace(/<answer>/g, "")
    .replace(/<\/answer>/g, "")
    .replace(/<prompt_analysis>/g, "**Analysis:** ")
    .replace(/<\/prompt_analysis>/g, "")
    .replace(/<analysis>/g, "**Analysis:** ")
    .replace(/<\/analysis>/g, "")
    .replace(/<thought>/g, "**Thought:** ")
    .replace(/<\/thought>/g, "")
    .replace(/<action>/g, "**Action:** ")
    .replace(/<\/action>/g, "")
    .replace(/<unclear_parts>/g, "**Unsure about:** ")
    .replace(/<\/unclear_parts>/g, "")
    .replace(/<key_elements>/g, "**Key Elements:** ")
    .replace(/<\/key_elements>/g, "")
    .replace(/<key_elements_missing>/g, "**Key Elements Missing:** ")
    .replace(/<\/key_elements_missing>/g, "")
    .replace(/<suggestions>/g, "**Suggestions:** ")
    .replace(/<\/suggestions>/g, "")
    .replace(/<suggestion>/g, "")
    .replace(/<\/suggestion>/g, "")
    .replace(/<revised_prompt>/g, "**Revised Prompt:** ")
    .replace(/<\/revised_prompt>/g, "")
    .replace(/<problem_breakdown>/g, "**Problem Breakdown:** ")
    .replace(/<\/problem_breakdown>/g, "");

  html = escapeHTML(html)
    // Headers (with proper spacing)
    .replace(/^### (.*?)$/gm, "<h3>$1</h3>\n")
    .replace(/^## (.*?)$/gm, "<h2>$1</h2>\n")
    .replace(/^# (.*?)$/gm, "<h1>$1</h1>\n")

    // Bold (handle both * and _)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")

    // Italic (handle both * and _)
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/_(.*?)_/g, "<em>$1</em>")

    // Images (updated with proper class names and styling)
    .replace(
      /!\[(.*?)\]\((.*?)\)/g,
      '<img src="$2" alt="$1" class="rounded-lg max-w-full h-auto my-4" loading="lazy" />',
    )

    // Links
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      `<a href="$2" target="_blank" rel="noopener noreferrer" class="${linkClassName}">$1</a>`,
    )

    // Handle Obsidian-style internal links
    .replace(/\[\[(.*?)\]\]/g, `<a href="$1" class="internal-link ${linkClassName}">$1</a>`)

    // Unordered lists (handle multiple levels)
    .replace(/^(\s*[-*+]\s+.*(?:\n(?!\s*[-*+]|\s*\d+\.).*)*)+/gm, (match) => {
      const items = match
        .split("\n")
        .map((line) => {
          const content = line.replace(/^\s*[-*+]\s+/, "").trim();
          return content ? `<li>${content}</li>` : "";
        })
        .filter(Boolean)
        .join("\n");
      return `<ul class="list-disc">${items}</ul>`;
    })

    // Ordered lists (handle multiple levels)
    .replace(/^(\s*\d+\.\s+.*(?:\n(?!\s*[-*+]|\s*\d+\.).*)*)+/gm, (match) => {
      const items = match
        .split("\n")
        .map((line) => {
          const content = line.replace(/^\s*\d+\.\s+/, "").trim();
          return content ? `<li>${content}</li>` : "";
        })
        .filter(Boolean)
        .join("\n");
      return `<ol class="list-decimal">${items}</ol>`;
    })

    // Blockquotes (handle multiple lines)
    .replace(
      /^(>\s+.*(?:\n(?!>).*)*)+/gm,
      (match) => `<blockquote>${match.replace(/^>\s+/gm, "")}</blockquote>`,
    )

    // Horizontal rules
    .replace(/^(?:---|\*\*\*|___)\s*$/gm, "<hr>")

    // Paragraphs (handle multiple lines, but not inside lists)
    .replace(
      /^(?!<[houl]|<bl|<hr)[^\n]+(?:\n(?!<[houl]|<bl|<hr)[^\n]+)*/gm,
      (match) => `<p class="${classNames.p || "text-base"}">${match.replace(/\n/g, "<br />")}</p>`,
    );

  // Restore code blocks with proper formatting
  html = html.replace(/{{CODEBLOCK(\d+)}}/g, (_, index) => {
    const code = codeBlocks[parseInt(index)];
    if (!code) return "";
    const lines = code.split("\n");
    const firstLine = lines[0]?.trim() || "";
    const hasLang = /^[a-zA-Z0-9]+$/.test(firstLine);
    const lang = hasLang ? firstLine : "";
    const content = hasLang ? lines.slice(1).join("\n").trim() : code;
    return `<pre><code${
      lang ? ` class="language-${lang}"` : ""
    }>${escapeHTML(content)}</code></pre>`;
  });

  // Restore inline code with proper formatting
  html = html.replace(/{{INLINECODE(\d+)}}/g, (_, index) => {
    const code = inlineCode[parseInt(index)];
    if (!code) return "";
    return `<code>${escapeHTML(code)}</code>`;
  });

  return createElement("div", {
    dangerouslySetInnerHTML: { __html: html },
  });
}
