import { notFound } from "next/navigation";

import { PageLayout } from "@/components/PageLayout";
import { InnerPage } from "@/components/InnerPage";
import { getBlogPosts, getBlogPostBySlug, extractHeadings } from "@/lib/blog";
import { CustomMDX } from "@/components/MDX";
import { parseMarkdown } from "@/lib/markdown";
import { AlertMessage } from "@/components/Alert";
import { Link } from "@/components/Link";
import { PostHeader } from "@/components/PostHeader";
import { PostSidebar } from "@/components/PostSidebar";

export const dynamicParams = false;

export async function generateStaticParams() {
	const posts = await getBlogPosts(true);

	return posts.map((post) => ({
		slug: post.slug,
	}));
}

export async function generateMetadata({ params }) {
	const { slug } = await params;
	const post = await getBlogPostBySlug(slug);

	if (!post) {
		return;
	}

	const { title, date: publishedTime, description, image_url } = post;
	const ogImage = image_url
		? `https://images.s3rve.co.uk/?image=${image_url}`
		: `https://nicholasgriffin.dev/og?title=${encodeURIComponent(title)}`;

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			type: "article",
			publishedTime,
			url: `https://nicholasgriffin.dev/blog/${post.slug}`,
			images: [
				{
					url: ogImage,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [ogImage],
		},
	};
}

export default async function Home({ params }) {
	const { slug } = await params;
	const post = await getBlogPostBySlug(slug);

	if (!post) {
		return <div>Post {slug} was not found</div>;
	}

	const dates = {
		created: post.created_at,
		updated: post.updated_at
	};

	const headings = extractHeadings(post.content);

	return (
		<PageLayout>
			<InnerPage>
				<script
					type="application/ld+json"
					suppressHydrationWarning
					// biome-ignore lint/security/noDangerouslySetInnerHtml: It's on purpose
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							"@context": "https://schema.org",
							"@type": "BlogPosting",
							headline: post.title,
							datePublished: post.created_at,
							dateModified: post.updated_at,
							description: post.description,
							image: post.image_url
								? `https://nicholasgriffin.dev/${post.image_url}`
								: `/og?title=${encodeURIComponent(post.title)}`,
							url: `https://nicholasgriffin.dev/blog/${post.slug}`,
							author: {
								"@type": "Person",
								name: "Nicholas Griffin",
							},
						}),
					}}
				/>

				<PostHeader post={post} dates={dates} />

				<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
					<div className="col-span-1 order-2 md:order-1 md:col-span-2 lg:col-span-3">
						<article className="prose dark:prose-invert pt-2 w-full max-w-none">
							{post.draft ? (
								<AlertMessage
									variant="warning"
									title="This post is a draft!"
									description="This post is a draft and may not be finished."
								/>
							) : null}
							{post.archived ? (
								<AlertMessage
									variant="warning"
									title="This post has been archived!"
									description="This post has been archived due to it being from a previous version of my site, or a bit too old. Some things might be broken and it may not be up to date."
								/>
							) : null}
							<div>{parseMarkdown(post.description || "")}</div>
							<CustomMDX source={post.content} />
							{post.metadata.link && (
								<Link href={post.metadata.link} className="text-primary-foreground">
									You can find the original post here.
								</Link>
							)}
						</article>
					</div>
					<div className="col-span-1 order-1 md:order-2">
						<PostSidebar post={post} headings={headings} />
					</div>
				</div>
			</InnerPage>
		</PageLayout>
	);
}