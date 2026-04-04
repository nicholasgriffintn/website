import { getBlogPosts } from "@/lib/blog";
import { CDN_CACHE_HEADERS } from "@/lib/constants";

const BASE_URL = "https://nicholasgriffin.dev";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function loader() {
  const allBlogs = await getBlogPosts();

  const itemsXml = allBlogs
    .sort((a, b) => (new Date(a.created_at) > new Date(b.created_at) ? -1 : 1))
    .map(
      (post) => `<item>
      <title>${escapeXml(post.title)}</title>
      <link>${BASE_URL}/blog/${post.slug}</link>
      <description>${escapeXml(post.description || "")}</description>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
      ${post.updated_at ? `<lastBuildDate>${new Date(post.updated_at).toUTCString()}</lastBuildDate>` : ""}
      <guid isPermaLink="true">${BASE_URL}/blog/${post.slug}</guid>
      ${post.tags?.length ? `<category>${post.tags.map((tag) => escapeXml(tag)).join("</category><category>")}</category>` : ""}
      ${post.metadata?.link ? `<source url="${escapeXml(post.metadata.link)}">Original Source</source>` : ""}
    </item>`,
    )
    .join("\n");

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nicholas Griffin</title>
    <link>${BASE_URL}</link>
    <description>Senior Software Engineer</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`;

  return new Response(rssFeed, {
    headers: {
      "Content-Type": "text/xml",
      ...CDN_CACHE_HEADERS,
    },
  });
}
