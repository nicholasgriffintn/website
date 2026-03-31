import type { BlogPost, Heading } from "@/types/blog";
import { FeaturedImage } from "@/components/FeaturedImage";
import type { SpeedReaderController } from "@/components/SpeedReader";
import { ArticleToolbar, type ArticleMode } from "@/components/ArticleToolbar";

interface PostSidebarProps {
  post: BlogPost;
  headings: Heading[];
  mode: ArticleMode;
  onModeChange: (mode: ArticleMode) => void;
  speedReaderController: SpeedReaderController;
}

function FeaturedImageSection({ post }: { post: BlogPost }) {
  if (!post.image_url || post.metadata.hideFeaturedImage) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-lg">
      <FeaturedImage src={post.image_url} alt={post.image_alt || post.title} />
    </div>
  );
}

export function PostSidebar({
  post,
  headings,
  mode,
  onModeChange,
  speedReaderController,
}: PostSidebarProps) {
  return (
    <aside className="sticky top-20 space-y-6">
      <FeaturedImageSection post={post} />
      <ArticleToolbar
        post={post}
        headings={headings}
        mode={mode}
        onModeChange={onModeChange}
        speedReaderController={speedReaderController}
      />
    </aside>
  );
}
