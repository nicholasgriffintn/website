const BASE_URL = "https://nicholasgriffin.dev";

const disallowedBots = [
  "Amazonbot",
  "magpie-crawler",
  "CCBot",
  "omgili",
  "omgilibot",
  "GPTBot",
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
  "Google-CloudVertexBot",
  "meta-externalagent",
  "OAI-SearchBot",
  "YandexAdditional",
  "YandexAdditionalBot",
  "TurnitinBot",
  "Amzn-SearchBot",
  "ProRataInc",
];

export function loader({ request }: { request: Request }) {
  const hostname = new URL(request.url).hostname;
  if (hostname !== "nicholasgriffin.dev") {
    return new Response("User-agent: *\nDisallow: /", {
      headers: { "Content-Type": "text/plain" },
    });
  }

  const rules = [
    "User-agent: *\nAllow: /",
    ...disallowedBots.map((bot) => `User-agent: ${bot}\nDisallow: /`),
  ].join("\n\n");

  const content = `${rules}\n\nSitemap: ${BASE_URL}/sitemap.xml\n`;

  return new Response(content, { headers: { "Content-Type": "text/plain" } });
}
