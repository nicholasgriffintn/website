import { CacheManager } from "./cache";
import { Heading } from "@/types/blog";
const BASE_API_URL = "https://content.s3rve.co.uk";
const cacheManager = new CacheManager<any>();

async function getApiData(path: string, params: Record<string, string> = {}) {
	const queryString = new URLSearchParams(params).toString();
	const fullPath = queryString ? `${path}?${queryString}` : path;
	const cacheKey = `api_${fullPath}`;

	const cached = cacheManager.get(cacheKey);
	if (cached) return cached;

	const url = `${BASE_API_URL}/${fullPath}`;
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const data = await response.json();
	cacheManager.set(cacheKey, data);
	return data;
}

export async function getBlogPosts(showArchived = false) {
	const params: Record<string, string> = {};
	if (showArchived) params.archived = 'true';

	if (process.env.ENVIRONMENT === 'development') {
		params.drafts = 'true';
	}

	if (process.env.ENVIRONMENT === 'development') {
		params.cacheBust = Math.random().toString(36).substring(2, 15);
	}

	try {
		const posts = await getApiData('content', params);
		return posts;
	} catch (error) {
		console.error('Failed to get blog posts:', error);
		return [];
	}
}

export async function getBlogPostBySlug(slug: string) {
	try {
		const params: Record<string, string> = {};

		if (process.env.ENVIRONMENT === 'development') {
			params.cacheBust = Math.random().toString(36).substring(2, 15);
		}

		const post = await getApiData(`content/${slug}`, params);
		return post;
	} catch (error) {
		console.error('Failed to get blog post:', error);
		return null;
	}
}

export async function getPaginatedBlogPosts({
	showArchived = false,
	page = 1,
	limit = 10,
}) {
	const posts = await getBlogPosts(showArchived);
	const startIndex = (page - 1) * limit;
	const endIndex = startIndex + limit;
	return posts.slice(startIndex, endIndex);
}

export async function getAllTags() {
	const posts = await getBlogPosts();
	const tagCounts = posts.reduce(
		(acc, post) => {
			if (Array.isArray(post.tags)) {
				post.tags.forEach((tag) => {
					acc[tag] = (acc[tag] || 0) + 1;
				});
			}
			return acc;
		},
		{} as Record<string, number>,
	);

	return tagCounts;
}

export async function getBlogPostsByTag(tag: string) {
	const posts = await getBlogPosts();
	return posts.filter((post) => post.tags?.includes(tag));
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
		const text = match[2];
		const slug = text
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');

			headings.push({
				text,
				level,
				slug,
			});
	}

	return headings;
}