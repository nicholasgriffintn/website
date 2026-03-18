import { ChevronUp } from "lucide-react";

import { PageLayout } from "@/components/PageLayout";
import { Link } from "@/components/Link";
import { InnerPage } from "@/components/InnerPage";
import { getRecentlyPlayed } from "@/lib/data/spotify";
import { getProjects } from "@/lib/data/projects";
import { getGitHubRepos } from "@/lib/data/github";
import { ProjectsList } from "@/components/ProjectsList";

export const metadata = {
  title: "Projects",
  description: "A collection of projects that I have worked on.",
};

async function getData() {
  const spotify = await getRecentlyPlayed();
  const projects = await getProjects();
  const featuredRepos = await getGitHubRepos({ limit: 8 });
  const repos = featuredRepos?.pageInfo?.hasNextPage
    ? await getGitHubRepos({
        limit: 8,
        cursor: featuredRepos?.pageInfo?.endCursor,
      })
    : undefined;

  return {
    spotify,
    projects,
    featuredRepos,
    repos,
  };
}

export default async function Home() {
  const data = await getData();

  const firstFeaturedProjects = data?.projects?.slice(0, 3);
  const lastFeaturedProjects = data?.projects?.slice(3);

  // TODO: Add a load more button to load more projects at the end of the list

  return (
    <PageLayout>
      <InnerPage>
        <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">Projects</h1>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-5 md:col-span-3 lg:col-span-3 pt-5">
            <div className="text-primary-foreground lg:max-w-[100%] prose dark:prose-invert">
              <p>
                It's my aim to spend a big percentage of my personal time on a number of projects.
              </p>
              <p>
                I often work on quite a few different things that you might find interesting, take a
                look at some of them below.
              </p>
              <p>
                You can also take a look at my <Link href="/snippets">code snippets</Link> for some
                of my quick fixes and tips.
              </p>
            </div>
          </div>
          <div className="col-span-5 md:col-span-2 lg:col-span-2">
            <picture>
              <source
                media="(prefers-color-scheme: dark)"
                srcSet="https://nicholasgriffintn.github.io/nicholasgriffintn/github-contribution-grid-snake-dark.svg"
              />
              <source
                media="(prefers-color-scheme: light)"
                srcSet="https://nicholasgriffintn.github.io/nicholasgriffintn/github-contribution-grid-snake.svg"
              />
              <img
                alt="My Contributions Graph"
                src="https://nicholasgriffintn.github.io/nicholasgriffintn/github-contribution-grid-snake.svg"
              />
            </picture>
            <div className="text-sm text-muted-foreground text-center inline-flex justify-center w-full mt-5">
              <span>My GitHub Contributions Graph</span>
              <ChevronUp />
            </div>
          </div>
        </div>
        <div className="pt-5 md:pt-20">
          <ProjectsList
            firstFeaturedProjects={firstFeaturedProjects}
            featuredRepos={data?.featuredRepos?.nodes}
            lastFeaturedProjects={lastFeaturedProjects}
            showAll={true}
            repos={data?.repos?.nodes}
          />
        </div>
      </InnerPage>
    </PageLayout>
  );
}
