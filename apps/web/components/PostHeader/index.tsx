import { Bookmark } from 'lucide-react';

import { formatDate } from '@/lib/blog';
import { Metadata } from '@/types/blog';
import { Link } from '@/components/Link';

export function PostHeader({
  isBookmark,
  post,
  dates,
}: {
  isBookmark: boolean;
  post: Metadata;
  dates: { created: string; updated?: string };
}) {
  return (
    <>
      {isBookmark && (
        <div className="mb-2">
          <Bookmark className="h-5 w-5 text-white fill-white" />
        </div>
      )}
      <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
        {post.title}
      </h1>
      <div className="mt-8">
        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="text-sm text-muted-foreground flex flex-wrap items-center space-x-2 mb-2">
            <span className="text-sm text-muted-foreground">Tags:</span>
            {post.tags.map((tag) => (
              <Link key={tag} href={`/tags/${tag}`} muted>
                #{tag}
              </Link>
            ))}
          </div>
        )}
        {dates.created && (
          <span className="text-sm text-muted-foreground">
            Published on {formatDate(dates.created)}
          </span>
        )}
        {dates.updated && (
          <>
            <span className="text-sm text-muted-foreground"> • </span>
            <span className="text-sm text-muted-foreground">
              Updated on {formatDate(dates.updated)}
            </span>
          </>
        )}
      </div>
    </>
  );
}
