import { PageLayout } from "@/components/PageLayout";
import { InnerPage } from "@/components/InnerPage";
import { getBlogPostsByTag } from "@/lib/blog";
import { BlogCard } from "@/components/BlogCard";

export const metadata = {
  title: "Blog",
  description: "A collection of blog posts that I have written.",
};

async function getData(tag: string) {
  const posts = await getBlogPostsByTag(tag);

  return {
    posts,
  };
}

export default async function BlogPostsByTag({ params }) {
  const { slug } = await params;
  const data = await getData(slug);

  return (
    <PageLayout>
      <InnerPage>
        <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
          Content tagged with `{slug}`
        </h1>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-5 md:col-span-3 lg:col-span-4 pt-5">
            <div className="text-primary-foreground lg:max-w-[75%]">
              <p>
                A collection of the blog posts that I have written that are tagged with `{slug}`.
              </p>
            </div>
          </div>
        </div>
        {data?.posts && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {data.posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </InnerPage>
    </PageLayout>
  );
}
