import { MessageSquare, Activity, LineChart } from "lucide-react";

import { PageLayout } from "@/components/PageLayout";
import { Link } from "@/components/Link";
import { InnerPage } from "@/components/InnerPage";

export const metadata = {
	title: "AI",
	description: "A collection of projects that I have worked on.",
};

export default async function Home() {
	return (
		<PageLayout>
			<InnerPage>
				<h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
					AI
				</h1>
				<div className="grid grid-cols-5 gap-4">
					<div className="col-span-5 md:col-span-3 lg:col-span-3 pt-5">
						<div className="text-primary-foreground lg:max-w-[100%] prose dark:prose-invert">
							<p>
								None of the content that I publish on this site was written by
								an AI tool.
							</p>
							<p>
								While I do use LLM models during my research for articles, and
								sometimes to generate an initial structure, I always completely
								write the published article myself.
							</p>
							<p>
								You can read my{" "}
								<Link href="/blog/my-thoughts-and-principles-around-the-use-of-ai">
									blog post
								</Link>{" "}
								for more of my thoughts on the use of AI in the industry. You'll{" "}
								also find some of the applications I've built with AI below.
							</p>
							<p>
								If you'd like to generate your own AI manifesto, you
								should start with this{" "}
								<Link href="https://www.bydamo.la/p/ai-manifesto">page</Link>.
							</p>
						</div>
					</div>
				</div>

				<h2 className="text-xl md:text-2xl font-bold text-primary-foreground mt-8 mb-4">
					AI Applications
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<Link underline={false} href="/ai/chat" className="block p-6 rounded-lg border border-border hover:border-primary transition-colors">
						<div className="flex items-center gap-3 mb-2">
							<MessageSquare className="w-6 h-6" />
							<h3 className="font-semibold text-lg">Chat</h3>
						</div>
						<p className="text-muted-foreground">
							Interactive chat interface powered by advanced language models, available for signed in only.
						</p>
					</Link>

					<Link underline={false} href="/ai/benchmarks" className="block p-6 rounded-lg border border-border hover:border-primary transition-colors">
						<div className="flex items-center gap-3 mb-2">
							<Activity className="w-6 h-6" />
							<h3 className="font-semibold text-lg">Benchmarks</h3>
						</div>
						<p className="text-muted-foreground">
							Performance comparisons of different AI models and configurations.
						</p>
					</Link>

					<Link underline={false} href="/ai/metrics" className="block p-6 rounded-lg border border-border hover:border-primary transition-colors">
						<div className="flex items-center gap-3 mb-2">
							<LineChart className="w-6 h-6" />
							<h3 className="font-semibold text-lg">Metrics</h3>
						</div>
						<p className="text-muted-foreground">
							Analytics and insights from my AI system usage and performance.
						</p>
					</Link>
				</div>
			</InnerPage>
		</PageLayout>
	);
}
