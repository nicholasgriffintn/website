import { formatDate } from "@/lib/blog";
import { Link } from "@/components/Link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseMarkdown } from "@/lib/markdown";
import { Image } from "@/components/Image";
import { Bookmark } from "lucide-react";

export function BlogCard({ post }) {
	const postLink = post.metadata.link || `/blog/${post.slug}`;
	const isBookmark = post.metadata.isBookmark;
	const postContent = parseMarkdown(
		post.description,
		false,
	);

	return (
    <Card className="overflow-hidden relative">
      {post.image_url && (
        <div className="max-h-[190px] min-h-[190px] overflow-hidden h-full">
          <Image
            src={post.image_url}
            alt={post.image_alt || post.title}
            className="w-full object-cover"
            loading="lazy"
            width={700}
            height={190}
          />
        </div>
      )}
      <CardHeader>
        <CardTitle>
          {isBookmark && (
            <div className="mb-2">
              <Bookmark className="h-5 w-5 text-white fill-white" />
            </div>
          )}
          {isBookmark && !post.metadata.link ? (
            <div className="text-2xl font-semibold leading-none tracking-tight space-x-2 leading-7">
              {post.title}
            </div>
          ) : (
            <Link
              className="text-2xl font-semibold leading-none tracking-tight space-x-2 leading-7"
              href={postLink}
              target={post.metadata.link ? '_blank' : undefined}
              underline={false}
            >
              {post.title}
            </Link>
          )}
          {post.archived ? <Badge>Archived</Badge> : null}
          {post.draft ? <Badge>Draft</Badge> : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-primary-foreground mb-4">
          {postContent}
          {!isBookmark && !post.metadata.link && (
            <span>
              <Link
                href={postLink}
                target={post.metadata.link ? '_blank' : undefined}
              >
                Read more
                <span className="sr-only"> about {post.title}</span>
              </Link>
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground mb-4">
          {post.created_at && (
            <span>
              Published: {formatDate(post.created_at)}
              {post.updated_at && ' (Updated)'}
            </span>
          )}
          {Array.isArray(post.tags) && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${tag}`}
                  muted
                  className="p-1 hover:underline"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
