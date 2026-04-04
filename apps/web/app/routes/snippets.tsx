import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { PageLayout } from "@/components/PageLayout";
import { InnerPage } from "@/components/InnerPage";
import { getGitHubGists } from "@/lib/data/github";
import { SnippetsList } from "@/components/SnippetsList";

export const meta: MetaFunction = () => [
  { title: "Code Snippets | Nicholas Griffin" },
  {
    name: "description",
    content: "A collection of code snippets that I have made available on Github Gists.",
  },
];

export async function loader({ request, context }: LoaderFunctionArgs) {
  const snippets = await getGitHubGists({
    request,
    executionContext: context?.cloudflare?.ctx,
  });
  return { snippets };
}

export default function Snippets() {
  const { snippets } = useLoaderData<typeof loader>();

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
          <SnippetsList gists={snippets} />
        </div>
      </InnerPage>
    </PageLayout>
  );
}
