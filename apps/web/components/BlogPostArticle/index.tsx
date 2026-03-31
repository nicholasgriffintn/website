import type React from "react";

import { CustomMDX } from "@/components/MDX";
import { parseMarkdown } from "@/lib/markdown";
import { AlertMessage } from "@/components/Alert";
import { Link } from "@/components/Link";
import { VideoCardPlayer } from "@/components/VideoCardPlayer";
import type { BlogPost } from "@/types/blog";

type MdxSource = React.ComponentProps<typeof CustomMDX>["source"];

interface BlogPostArticleProps {
  post: BlogPost;
  mdxTree: MdxSource;
  youtubeVideoId: string | null;
}

export function BlogPostArticle({ post, mdxTree, youtubeVideoId }: BlogPostArticleProps) {
  return (
    <>
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
        <CustomMDX source={mdxTree} />
        {post.metadata.link && (
          <Link href={post.metadata.link} className="text-primary-foreground">
            You can find the original post here.
          </Link>
        )}
      </article>
    </>
  );
}
