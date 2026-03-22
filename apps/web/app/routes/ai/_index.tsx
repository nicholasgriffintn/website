import type { MetaFunction } from "react-router";
import { Activity, MessageSquare } from "lucide-react";

import { PageLayout } from "@/components/PageLayout";
import { LinkCard } from "@/components/LinkCard";
import { PolychatAppCards } from "@/components/PolychatAppCards";
import { Link } from "@/components/Link";
import { InnerPage } from "@/components/InnerPage";
import { polychatApps } from "@/lib/data/polychat-apps";

export const meta: MetaFunction = () => [
  { title: "AI | Nicholas Griffin" },
  {
    name: "description",
    content: "A collection of projects that I have worked on.",
  },
];

export default function AI() {
  return (
    <PageLayout>
      <InnerPage>
        <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">AI</h1>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-5 md:col-span-3 lg:col-span-3 pt-5">
            <div className="text-primary-foreground lg:max-w-[100%] prose dark:prose-invert">
              <p>None of the content that I publish on this site was written by an AI tool.</p>
              <p>
                While I do use LLM models during my research for articles, and sometimes to generate
                an initial structure, I always completely write the published article myself.
              </p>
              <p>
                You can read my{" "}
                <Link href="/blog/my-thoughts-and-principles-around-the-use-of-ai">blog post</Link>{" "}
                for more of my thoughts on the use of AI in the industry. You'll also find some of
                the applications I've built with AI below.
              </p>
              <p>
                If you'd like to generate your own AI manifesto, you should start with this{" "}
                <Link href="https://www.bydamo.la/p/ai-manifesto">page</Link>.
              </p>
            </div>
          </div>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-primary-foreground mt-8 mb-4">
          Applications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <LinkCard
            icon={<MessageSquare className="w-6 h-6" />}
            title="Chat"
            description="Interactive chat interface powered by advanced language models, available for signed in only."
            href="https://polychat.app/"
            external
          />
          <LinkCard
            icon={<Activity className="w-6 h-6" />}
            title="Benchmarks"
            description="Performance comparisons of different AI models and configurations."
            href="/ai/benchmarks"
          />
        </div>
        <h3 className="text-lg md:text-xl font-semibold text-primary-foreground mb-4">
          AI apps on Polychat
        </h3>
        <p>
          These are a selection of apps that I've built with reusable services on my Polychat
          platform. These are provided alongside a number of other implementations that you can
          check out.
        </p>
        <PolychatAppCards apps={polychatApps} />
      </InnerPage>
    </PageLayout>
  );
}
