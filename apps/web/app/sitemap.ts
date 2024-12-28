import { getBlogPosts } from "@/lib/blog";

export const baseUrl = "https://nicholasgriffin.dev";

export default async function sitemap() {
    const routes = ['', '/blog'].map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date().toISOString().split('T')[0],
      changeFrequency: 'weekly',
      priority: 1.0,
    }));

    const posts = await getBlogPosts();

    if (!posts) {
      return [...routes];
    }

    const blogs = posts.map((post) => {
      const date = post.metadata.updated || post.metadata.date;
      const lastModified = date
        ? new Date(date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      return {
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified,
        priority: 0.5,
      };
    });

    return [...routes, ...blogs];
}
