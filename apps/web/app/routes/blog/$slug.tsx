import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, data } from "react-router";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";

import { PageLayout } from "@/components/PageLayout";
import { InnerPage } from "@/components/InnerPage";
import { getBlogPostBySlug, extractHeadings } from "@/lib/blog";
import { CustomMDX } from "@/components/MDX";
import { parseMarkdown } from "@/lib/markdown";
import { AlertMessage } from "@/components/Alert";
import { Link } from "@/components/Link";
import { PostHeader } from "@/components/PostHeader";
import { PostSidebar } from "@/components/PostSidebar";
import { getYoutubeVideoId } from "@/lib/youtube";
import { VideoCardPlayer } from "@/components/VideoCardPlayer";

export async function loader({ params }: LoaderFunctionArgs) {
  const post = await getBlogPostBySlug(params.slug!);
  if (!post) throw data("Not found", { status: 404 });
  const headings = extractHeadings(post.content);
  const mdxSource = await serialize(post.content, {
    mdxOptions: { remarkPlugins: [remarkGfm] },
  });
  return { post, headings, mdxSource };
}

export const meta: MetaFunction<typeof loader> = ({ data: loaderData }) => {
  if (!loaderData?.post) return [{ title: "Post not found | Nicholas Griffin" }];
  const { title, description, image_url, slug, created_at } = loaderData.post;
  const ogImage = image_url
    ? `https://images.s3rve.co.uk/?image=${image_url}`
    : `https://nicholasgriffin.dev/og?title=${encodeURIComponent(title)}`;
  return [
    { title: `${title} | Nicholas Griffin` },
    { name: "description", content: description ?? "" },
    { property: "og:title", content: title },
    { property: "og:description", content: description ?? "" },
    { property: "og:type", content: "article" },
    { property: "og:published_time", content: created_at },
    { property: "og:url", content: `https://nicholasgriffin.dev/blog/${slug}` },
    { property: "og:image", content: ogImage },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description ?? "" },
    { name: "twitter:image", content: ogImage },
  ];
};

export default function BlogPost() {
  const { post, headings, mdxSource } = useLoaderData<typeof loader>();

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
              description: post.description,
              image: post.image_url
                ? `https://nicholasgriffin.dev/${post.image_url}`
                : `/og?title=${encodeURIComponent(post.title)}`,
              url: `https://nicholasgriffin.dev/blog/${post.slug}`,
              author: { "@type": "Person", name: "Nicholas Griffin" },
            }),
          }}
        />
        <PostHeader isBookmark={isBookmark} post={post} dates={dates} />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
          <div className="col-span-1 order-2 md:order-1 md:col-span-2 lg:col-span-3">
            {youtubeVideoId && (
              <div className="mb-4 w-full h-[400px] md:h-[500px] lg:h-[600px]">
                <VideoCardPlayer videoId={youtubeVideoId} slug={post.slug} title={post.title} />
              </div>
            )}
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
              <CustomMDX source={mdxSource} />
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
