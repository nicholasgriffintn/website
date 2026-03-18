const BASE_URL = "https://nicholasgriffin.dev";

const disallowedBots = [
  "magpie-crawler",
  "CCBot",
  "omgili",
  "omgilibot",
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "cohere-ai",
  "Bytespider",
  "PetalBot",
  "PerplexityBot",
  "Scrapy",
  "Applebot-Extended",
  "Google-Extended",
];

export function loader() {
  // TODO: Make this work
  /* if (domainName !== 'nicholasgriffin.dev') {
    return new Response('User-agent: *\nDisallow: /', {
      headers: { 'Content-Type': 'text/plain' },
    });
  } */

  const rules = [
    "User-agent: *\nAllow: /",
    ...disallowedBots.map((bot) => `User-agent: ${bot}\nDisallow: /`),
  ].join("\n\n");

  const content = `${rules}\n\nSitemap: ${BASE_URL}/sitemap.xml\n`;

  return new Response(content, { headers: { "Content-Type": "text/plain" } });
}
