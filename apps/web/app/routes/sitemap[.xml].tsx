import { getBlogPosts } from "@/lib/blog";
import { CDN_CACHE_HEADERS } from "@/lib/constants";

const BASE_URL = "https://nicholasgriffin.dev";

export async function loader() {
  const routes = ["", "/blog"].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: "weekly",
    priority: 1.0,
  }));

  const posts = await getBlogPosts();

  const blogs = (posts ?? []).map((post) => {
    const date = post.updated_at || post.created_at;
    return {
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: date
        ? new Date(date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      priority: 0.5,
    };
  });

  const allUrls = [...routes, ...blogs];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allUrls
    .map(
      (entry) => `<url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <priority>${entry.priority}</priority>
  </url>`,
    )
    .join("\n  ")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      ...CDN_CACHE_HEADERS,
    },
  });
}
