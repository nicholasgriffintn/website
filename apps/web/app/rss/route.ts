import { baseUrl } from "../sitemap";
import { getBlogPosts } from "@/lib/blog";

function escapeXml(unsafe: string): string {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export async function GET() {
	const allBlogs = await getBlogPosts();

	const itemsXml = allBlogs
		.sort((a, b) => {
			if (new Date(a.created_at) > new Date(b.created_at)) {
				return -1;
			}
			return 1;
		})
		.map(
			(post) => {
				return `<item>
          <title>${escapeXml(post.title)}</title>
          <link>${baseUrl}/blog/${post.slug}</link>
          <description>${escapeXml(post.description || "")}</description>
          <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
          ${post.updated_at ? `<lastBuildDate>${new Date(post.updated_at).toUTCString()}</lastBuildDate>` : ''}
          <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
          ${post.tags?.length ? `<category>${post.tags.map(tag => escapeXml(tag)).join('</category><category>')}</category>` : ''}
          ${post.metadata?.link ? `<source url="${escapeXml(post.metadata.link)}">Original Source</source>` : ''}
        </item>`;
			}
		)
		.join("\n");

	const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wfw="http://wellformedweb.org/CommentAPI/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Nicholas Griffin</title>
        <link>${baseUrl}</link>
        <description>Senior Software Engineer</description>
        <language>en-us</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <atom:link href="${baseUrl}/rss" rel="self" type="application/rss+xml" />
        ${itemsXml}
    </channel>
  </rss>`;

	return new Response(rssFeed, {
		headers: {
			"Content-Type": "text/xml",
		},
	});
}
