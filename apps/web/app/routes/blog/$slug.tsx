import { useState } from "react";
import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, data } from "react-router";

import { PageLayout } from "@/components/PageLayout";
import { InnerPage } from "@/components/InnerPage";
import { getBlogPostBySlug, extractHeadings } from "@/lib/blog";
import { PostHeader } from "@/components/PostHeader";
import { PostSidebar } from "@/components/PostSidebar";
import { getYoutubeVideoId } from "@/lib/youtube";
import { compileMdxToHast } from "@/lib/mdx.server";
import { SpeedReaderStage, useSpeedReader } from "@/components/SpeedReader";
import { buildSpeedReaderText } from "@/lib/speed-reader";
import { BlogPostArticle } from "@/components/BlogPostArticle";
import type { ArticleMode } from "@/components/ArticleToolbar";
import { truncateMarkdownPreview } from "@/lib/utils";
import imageLoader from "@/lib/imageLoader";
import { DEFAULT_SITE_DESCRIPTION, SITE_AUTHOR, SITE_NAME, TWITTER_HANDLE } from "@/lib/seo";
import { resolveRequestOrigin } from "@/lib/request-origin";

function buildPostSeoData(
  post: NonNullable<Awaited<ReturnType<typeof getBlogPostBySlug>>>,
  speedReaderText: string,
  origin: string,
) {
  const canonicalUrl = `${origin}/blog/${post.slug}`;
  const description = truncateMarkdownPreview(post.description ?? speedReaderText, 160).trim();
  const imageUrl = post.image_url?.trim();
  const hasPostImage = Boolean(imageUrl);
  const ogImage = hasPostImage
    ? imageLoader({ src: imageUrl, width: 1200 })
    : `${origin}/og?title=${encodeURIComponent(post.title)}`;

  return {
    canonicalUrl,
    description: description || DEFAULT_SITE_DESCRIPTION,
    ogImage,
    isGeneratedOgImage: !hasPostImage,
  };
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const post = await getBlogPostBySlug(params.slug!);
  if (!post) throw data("Not found", { status: 404 });
  const origin = resolveRequestOrigin(request);
  const headings = extractHeadings(post.content);
  const mdxTree = await compileMdxToHast(post.content);
  const speedReaderText = buildSpeedReaderText(post.description, mdxTree);
  const seo = buildPostSeoData(post, speedReaderText, origin);
  return { post, headings, mdxTree, speedReaderText, seo };
}

export const meta: MetaFunction<typeof loader> = ({ data: loaderData }) => {
  if (!loaderData?.post) {
    return [{ title: `Post not found | ${SITE_NAME}` }];
  }

  const { post, seo } = loaderData;
  const metaTags = [
    { title: `${post.title} | ${SITE_NAME}` },
    { name: "description", content: seo.description },
    { tagName: "link", rel: "canonical", href: seo.canonicalUrl },
    { property: "og:title", content: post.title },
    { property: "og:description", content: seo.description },
    { property: "og:type", content: "article" },
    { property: "og:url", content: seo.canonicalUrl },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:image", content: seo.ogImage },
    { property: "og:image:alt", content: `Preview image for ${post.title}` },
    { property: "article:published_time", content: post.created_at },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: post.title },
    { name: "twitter:description", content: seo.description },
    { name: "twitter:image", content: seo.ogImage },
    { name: "twitter:creator", content: TWITTER_HANDLE },
    { name: "twitter:site", content: TWITTER_HANDLE },
    { name: "robots", content: "index, follow, max-image-preview:large" },
  ];

  if (post.updated_at) {
    metaTags.push({ property: "article:modified_time", content: post.updated_at });
  }

  if (seo.isGeneratedOgImage) {
    metaTags.push({ property: "og:image:width", content: "1200" });
    metaTags.push({ property: "og:image:height", content: "630" });
  }

  if (Array.isArray(post.tags)) {
    post.tags.slice(0, 8).forEach((tag) => {
      metaTags.push({ property: "article:tag", content: tag });
    });
  }

  return metaTags;
};

export default function BlogPost() {
  const { post, headings, mdxTree, speedReaderText, seo } = useLoaderData<typeof loader>();
  const [mode, setMode] = useState<ArticleMode>("listen");
  const speedReaderController = useSpeedReader({
    text: speedReaderText,
    isActive: mode === "focus",
  });

  const isBookmark = post.metadata.isBookmark;
  const youtubeVideoId = isBookmark ? getYoutubeVideoId(post.metadata.link) : null;
  const dates = { created: post.created_at, updated: post.updated_at };

  return (
    <PageLayout>
      <InnerPage>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: post.title,
              datePublished: post.created_at,
              dateModified: post.updated_at,
              description: seo.description,
              image: seo.ogImage,
              url: seo.canonicalUrl,
              author: { "@type": "Person", name: SITE_AUTHOR },
            }),
          }}
        />
        <PostHeader isBookmark={isBookmark} post={post} dates={dates} />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
          <div className="col-span-1 order-2 md:order-1 md:col-span-2 lg:col-span-3">
            {mode === "focus" ? (
              <div className="mb-4">
                <SpeedReaderStage controller={speedReaderController} />
              </div>
            ) : (
              <BlogPostArticle post={post} mdxTree={mdxTree} youtubeVideoId={youtubeVideoId} />
            )}
          </div>
          <div className="col-span-1 order-1 md:order-2">
            <PostSidebar
              post={post}
              headings={headings}
              mode={mode}
              onModeChange={setMode}
              speedReaderController={speedReaderController}
            />
          </div>
        </div>
      </InnerPage>
    </PageLayout>
  );
}
