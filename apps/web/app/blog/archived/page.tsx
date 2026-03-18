import { PageLayout } from "@/components/PageLayout";
import { InnerPage } from "@/components/InnerPage";
import { getBlogPosts } from "@/lib/blog";
import { BlogCard } from "@/components/BlogCard";

export const metadata = {
  title: "Blog + Archived",
  description:
    "A collection of blog posts that I have written alongside some general thoughts and links.",
};

async function getData() {
  const posts = await getBlogPosts(true);

  return {
    posts,
  };
}

export default async function ArchivedBlogHome() {
  const data = await getData();

  return (
    <PageLayout>
      <InnerPage>
        <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">Blog + Archived</h1>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-5 md:col-span-3 lg:col-span-4 pt-5">
            <div className="text-primary-foreground lg:max-w-[75%]">
              <p>This page shows all of my blog posts, including those that I have archived.</p>
            </div>
          </div>
        </div>
        {data?.posts && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </InnerPage>
    </PageLayout>
  );
}
