import { PageLayout } from "@/components/PageLayout";
import { InnerPage } from "@/components/InnerPage";
import { getAllTags } from "@/lib/blog";
import { Link } from "@/components/Link";

export const metadata = {
	title: "Tags",
	description: "My tags collection.",
};

async function getData() {
	const tags = await getAllTags();

	return {
		tags,
	};
}

export default async function TagsHome() {
	const data = await getData();

	const tags = data.tags;

	return (
    <PageLayout>
      <InnerPage>
        <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
          Tags
        </h1>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-5 md:col-span-3 lg:col-span-4 pt-5">
            <div className="text-primary-foreground lg:max-w-[75%]">
              <p>
                A collection of the tags that I have written about. Click on one
                to see the posts that are associated with it.
              </p>
            </div>
          </div>
        </div>
        {tags && (
          <div className="flex flex-wrap justify-center items-center w-full gap-4 py-8">
            {Object.keys(tags).map((tag) => {
              if (!tags[tag]) return null;

              const fontSize = Math.max(1, Math.min(2.5, 1 + tags[tag] / 8));
              return (
                <Link
                  key={tag}
                  href={`/tags/${tag}`}
                  className="inline-block px-4 py-2 rounded-lg bg-muted text-primary-foreground shadow transition-all duration-200 hover:bg-primary hover:scale-105 border border-border no-underline hover:underline"
                  style={{ fontSize: `${fontSize}em`, fontWeight: 'bold' }}
                >
                  {tag} ({tags[tag]})
                </Link>
              );
            })}
          </div>
        )}
      </InnerPage>
    </PageLayout>
  );
}
