import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { PageLayout } from "@/components/PageLayout";
import { InnerPage } from "@/components/InnerPage";
import { getBlogPostsByTag } from "@/lib/blog";
import { BlogCard } from "@/components/BlogCard";

export const meta: MetaFunction<typeof loader> = ({ params }) => [
  { title: `Tag: ${params.slug} | Nicholas Griffin` },
  { name: "description", content: `Blog posts tagged with ${params.slug}.` },
];

export async function loader({ params }: LoaderFunctionArgs) {
  const posts = await getBlogPostsByTag(params.slug!);
  return { posts, slug: params.slug };
}

export default function BlogPostsByTag() {
  const { posts, slug } = useLoaderData<typeof loader>();

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
        {posts && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </InnerPage>
    </PageLayout>
  );
}
