import { ChevronUp } from "lucide-react";

import { getRecentlyPlayed } from '@/lib/apple-music/getRecentlyPlayed';
import { getProjects } from '@/lib/data/projects';
import { getGitHubRepos } from '@/lib/data/github';
import { PageLayout } from '@/components/PageLayout';
import { AppleMusicWidget } from '@/components/AppleMusicWidget';
import { ContactLinks } from '@/components/ContactLinks';
import { InnerPage } from '@/components/InnerPage';
import { ProjectsList } from '@/components/ProjectsList';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/components/Link';
import { getPaginatedBlogPosts } from '@/lib/blog';
import { BlogCard } from '@/components/BlogCard';

export const revalidate = 60;

export const metadata = {
  title: 'Nicholas Griffin',
  description: 'The personal website of Nicholas Griffin',
};

async function getData() {
  const applemusic = await getRecentlyPlayed();
  const projects = await getProjects();
  const featuredRepos = await getGitHubRepos({ limit: 8 });
  const blogPosts = await getPaginatedBlogPosts({
    limit: 6,
  });

  return {
    applemusic,
    projects,
    featuredRepos,
    blogPosts,
  };
}

export default async function Home() {
  const data = await getData();

  const firstFeaturedProjects = data?.projects?.slice(0, 3);
  const lastFeaturedProjects = data?.projects?.slice(3);

  return (
    <PageLayout>
      <InnerPage>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-5 md:col-span-3 lg:col-span-4 pt-5">
            <div className="text-primary-foreground lg:max-w-[75%]">
              <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
                👋 Welcome to my website!
              </h1>
              <p>Thanks for visiting my site!</p>
              <p>
                I'm Nicholas Griffin, a Senior Software Engineer from the UK,
                currently with the BBC.
              </p>
              <h2 className="text-1xl md:text-2xl font-bold text-primary-foreground">
                About me
              </h2>
              <p>
                I'm a Full Stack Developer, leaning a bit more towards frontend
                work. My time outside of my main role is spent on various
                personal projects across the web.
              </p>
              <p>
                Beyond development, I enjoy reading now and then and have a
                passion for discovering new music — mainly trying to outsmart
                the algorithms.
              </p>
              <p>Feel free to explore more about me and my projects below.</p>
              <ContactLinks />
            </div>
          </div>
          <div className="col-span-5 md:col-span-2 lg:col-span-1 pt-10 lg:pt-5">
            <div>
              <AppleMusicWidget data={data?.applemusic} />
              <div className="text-sm text-muted-foreground text-center inline-flex justify-center w-full mt-5">
                <span>What I&apos;m listening to</span>
                <ChevronUp />
              </div>
            </div>
          </div>
        </div>
        <div className="mx-break-out pt-5 lg:mt-20 relative">
          <div className="lg:bg-[#171923] w-full lg:min-h-[240px] lg:absolute top-0 left-0" />
          <div className="lg:container relative">
            <div className="text-left pb-5">
              <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground md:pt-5">
                What's going on?
              </h2>
              <p>
                Below you will find some of the blog posts that I have wrote
                (and just a few thoughts and links), I used to write a lot and
                I'm looking to write blog posts more about the projects that I
                am working on. There might not be a lot here but I hope that it
                will at least be interesting, at least to me.
              </p>
            </div>
            <section>
              {data?.blogPosts && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.blogPosts.map((post) => (
                    <BlogCard key={post.slug} post={post} />
                  ))}
                </div>
              )}
              <div className="w-full flex justify-left pt-5">
                <Link
                  href="/blog"
                  className={buttonVariants({ variant: 'default', size: 'lg' })}
                  underline={false}
                >
                  View all of my blog posts
                </Link>
              </div>
            </section>
            <div className="text-left pt-5 pb-5">
              <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground md:pt-5">
                So what is it that you do? 🤔
              </h2>
              <p>
                Well quite a few things, here are some of my favourite projects
                alongside my most recently updated GitHub repos:
              </p>
            </div>
            <ProjectsList
              firstFeaturedProjects={firstFeaturedProjects}
              featuredRepos={data?.featuredRepos?.nodes}
              lastFeaturedProjects={lastFeaturedProjects}
            />
          </div>
        </div>
      </InnerPage>
    </PageLayout>
  );
}
