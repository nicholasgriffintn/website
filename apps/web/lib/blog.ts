import { CacheManager } from "./cache";
import type { Heading } from "@/types/blog";
import type { BlogPost } from "@/types/blog";
import { slugify } from "./slugs";
import { getEnvValue } from "./env";
import { parsePositiveInteger } from "./numbers";

const DEFAULT_BLOG_API_BASE_URL = "https://content.s3rve.co.uk";

const BASE_API_URL = (getEnvValue("BLOG_API_BASE_URL") ?? DEFAULT_BLOG_API_BASE_URL).replace(
  /\/+$/,
  "",
);
const cacheManager = new CacheManager<unknown>();

type BlogPostsOptions = {
  showArchived?: boolean;
  tag?: string;
  page?: number;
  limit?: number;
};

function normalizeVoidElements(content?: string | null) {
  if (typeof content !== "string") {
    return content ?? "";
  }

  return content.replace(/<br(?!\s*\/)\s*>/gi, "<br />").replace(/<hr(?!\s*\/)\s*>/gi, "<hr />");
}

async function getApiData<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const queryString = new URLSearchParams(params).toString();
  const fullPath = queryString ? `${path}?${queryString}` : path;
  const cacheKey = `api_${fullPath}`;

  return cacheManager.upsert(cacheKey, async () => {
    const url = `${BASE_API_URL}/${fullPath}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return (await response.json()) as T;
  });
}

function resolveBlogPostsOptions(options?: BlogPostsOptions | boolean): BlogPostsOptions {
  if (typeof options === "boolean") {
    return {
      showArchived: options,
    };
  }

  return options ?? {};
}

function buildTagCounts(posts: BlogPost[]): Record<string, number> {
  return posts.reduce(
    (acc, post) => {
      if (Array.isArray(post.tags)) {
        post.tags.forEach((tag) => {
          if (!tag) return;
          acc[tag] = (acc[tag] || 0) + 1;
        });
      }
      return acc;
    },
    {} as Record<string, number>,
  );
}

export async function getBlogPosts(options?: BlogPostsOptions | boolean): Promise<BlogPost[]> {
  const resolvedOptions = resolveBlogPostsOptions(options);
  const params: Record<string, string> = {};
  if (resolvedOptions.showArchived) params.archived = "true";
  if (resolvedOptions.tag) params.tag = resolvedOptions.tag;

  const page = parsePositiveInteger(resolvedOptions.page);
  const limit = parsePositiveInteger(resolvedOptions.limit);

  if (page) params.page = String(page);
  if (limit) params.limit = String(limit);

  if (getEnvValue("ENVIRONMENT") === "development") {
    params.drafts = "true";
  }

  try {
    const posts = await getApiData<BlogPost[]>("content", params);
    return posts;
  } catch (error) {
    console.error("Failed to get blog posts:", error);
    return [];
  }
}

export async function getBlogPostBySlug(slug: string) {
  try {
    const post = await getApiData<BlogPost>(`content/${slug}`);
    if (post?.content) {
      post.content = normalizeVoidElements(post.content);
    }
    return post;
  } catch (error) {
    console.error("Failed to get blog post:", error);
    return null;
  }
}

export async function getPaginatedBlogPosts({ showArchived = false, page = 1, limit = 10 }) {
  return getBlogPosts({ showArchived, page, limit });
}

export async function getAllTags() {
  const params: Record<string, string> = {};
  if (getEnvValue("ENVIRONMENT") === "development") {
    params.drafts = "true";
  }

  try {
    return await getApiData<Record<string, number>>("content/tags", params);
  } catch (error) {
    console.warn("Failed to get tags from tag endpoint, falling back to post scan:", error);
    const posts = await getBlogPosts();
    return buildTagCounts(posts);
  }
}

export async function getBlogPostsByTag(tag: string) {
  return getBlogPosts({ tag });
}

export function formatDate(date: string, includeRelative = false) {
  const currentDate = new Date();
  const targetDate = new Date(date.includes("T") ? date : `${date}T00:00:00`);
  const diffTime = currentDate.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths =
    currentDate.getMonth() -
    targetDate.getMonth() +
    12 * (currentDate.getFullYear() - targetDate.getFullYear());
  const diffYears = currentDate.getFullYear() - targetDate.getFullYear();

  let formattedDate = "";
  if (diffYears > 0) {
    formattedDate = `${diffYears}y ago`;
  } else if (diffMonths > 0) {
    formattedDate = `${diffMonths}mo ago`;
  } else if (diffDays > 0) {
    formattedDate = `${diffDays}d ago`;
  } else {
    formattedDate = "Today";
  }

  const fullDate = targetDate.toLocaleString("en-gb", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return includeRelative ? `${fullDate} (${formattedDate})` : fullDate;
}

export function extractHeadings(content: string) {
  const headingRegex = /^(#{2,6})\s+(.+)$/gm;
  const headings: Heading[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    let text = match[2];

    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    const slug = slugify(text);

    headings.push({
      text,
      level,
      slug,
    });
  }

  return headings;
}
