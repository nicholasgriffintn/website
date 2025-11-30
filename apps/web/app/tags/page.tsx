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
          <div className="flex justify-center flex-wrap w-full align-center gap-2 leading-8">
            {Object.keys(tags).map((tag) => {
              if (!tags[tag]) return null;

              const fontSize = Math.min(3, 1 + tags[tag] / 5);
              return (
                <div key={tag} style={{ fontSize: `${fontSize}em` }}>
                  <Link href={`/tags/${tag}`}>
                    {tag} ({tags[tag]})
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </InnerPage>
    </PageLayout>
  );
}
