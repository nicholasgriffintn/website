import { PageLayout } from "@/components/PageLayout";
import { InnerPage } from "@/components/InnerPage";
import { getGitHubGists } from "@/lib/data/github";
import { SnippetsList } from "@/components/SnippetsList";

export const metadata = {
  title: "Code Snippets",
  description: "A collection of code snippets that I have made available on Github Gists.",
};

async function getData() {
  const snippets = await getGitHubGists();

  return {
    snippets,
  };
}

export default async function Home() {
  const data = await getData();

  return (
    <PageLayout>
      <InnerPage>
        <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">Code Snippets</h1>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-5 md:col-span-3 lg:col-span-3 pt-5">
            <div className="text-primary-foreground lg:max-w-[100%] prose dark:prose-invert">
              <p>
                These are some random code snippets that I have made available on Github's Gists
                platform. You'll find a range of things here from the day to day bug fix up to
                something that might be a little more useful.
              </p>
            </div>
          </div>
        </div>
        <div className="pt-5 md:pt-20">
          <SnippetsList gists={data.snippets} />
        </div>
      </InnerPage>
    </PageLayout>
  );
}
