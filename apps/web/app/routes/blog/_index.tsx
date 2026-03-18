import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";

import { PageLayout } from "@/components/PageLayout";
import { InnerPage } from "@/components/InnerPage";
import { getBlogPosts } from "@/lib/blog";
import { BlogCard } from "@/components/BlogCard";
import { Link } from "@/components/Link";

export const meta: MetaFunction = () => [
  { title: "Blog | Nicholas Griffin" },
  {
    name: "description",
    content:
      "A collection of blog posts that I have written alongside some general thoughts and links.",
  },
];

export async function loader() {
  const posts = await getBlogPosts(false);
  return { posts };
}

export default function BlogHome() {
  const { posts } = useLoaderData<typeof loader>();

  return (
    <PageLayout>
      <InnerPage>
        <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">Blog</h1>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-5 md:col-span-3 lg:col-span-4 pt-5">
            <div className="text-primary-foreground lg:max-w-[75%]">
              <p>
                I've been running my own blogs since 2011, I started off with my own technology blog
                called TechNutty. I worked on that for just short of 7 years, during which time I
                also ran this personal site and have been updating it since.
              </p>
              <p>
                Check out my latest posts below, if you prefer RSS, you can find a{" "}
                <Link href="/rss.xml">feed for that here</Link>.
              </p>
            </div>
          </div>
        </div>
        {posts && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
        <p className="text-muted-foreground pt-5">
          By default, archived posts are not shown. If you would like to see them, you can do so by
          clicking{" "}
          <Link href="/blog/archived" muted>
            here
          </Link>
          .
        </p>
      </InnerPage>
    </PageLayout>
  );
}
