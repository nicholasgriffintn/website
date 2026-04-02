import type { Config } from "@react-router/dev/config";

import { getEnvValue } from "./lib/env";

const DEFAULT_BLOG_API_BASE_URL = "https://content.s3rve.co.uk";

type PrerenderBlogPost = {
  slug?: string;
  tags?: string[];
};

async function getDynamicBlogAndTagPaths() {
  const blogApiBaseUrl = (getEnvValue("BLOG_API_BASE_URL") ?? DEFAULT_BLOG_API_BASE_URL).replace(
    /\/+$/,
    "",
  );

  try {
    const response = await fetch(`${blogApiBaseUrl}/content`);
    if (!response.ok) {
      throw new Error(`Failed to fetch blog content for prerendering (${response.status})`);
    }

    const posts = (await response.json()) as PrerenderBlogPost[];
    const blogPaths = posts
      .map((post) => post.slug)
      .filter((slug): slug is string => typeof slug === "string" && slug.length > 0)
      .map((slug) => `/blog/${encodeURIComponent(slug)}`);

    const tagPaths = Array.from(
      new Set(
        posts
          .flatMap((post) => post.tags ?? [])
          .filter((tag): tag is string => typeof tag === "string" && tag.length > 0)
          .map((tag) => `/tags/${encodeURIComponent(tag)}`),
      ),
    );

    return [...blogPaths, ...tagPaths];
  } catch (error) {
    console.warn("Skipping dynamic blog prerender paths due to fetch failure", error);
    return [];
  }
}

export default {
  ssr: true,
  prerender: {
    paths: async ({ getStaticPaths }) => {
      const staticBlogAndTagPaths = getStaticPaths().filter(
        (path) => path.startsWith("/blog") || path.startsWith("/tags"),
      );
      const dynamicPaths = await getDynamicBlogAndTagPaths();
      return Array.from(new Set([...staticBlogAndTagPaths, ...dynamicPaths]));
    },
    unstable_concurrency: 8,
  },
  future: {
    v8_viteEnvironmentApi: true,
  },
} satisfies Config;
