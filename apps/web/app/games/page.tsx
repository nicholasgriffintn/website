import { Brush, Circle } from "lucide-react";

import { PageLayout } from "@/components/PageLayout";
import { InnerPage } from "@/components/InnerPage";
import { LinkCard } from "@/components/LinkCard";

export const metadata = {
	title: "Games",
	description: "A collection of games that I have worked on.",
};

export default async function Home() {
	return (
		<PageLayout>
			<InnerPage>
				<h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
					Games
				</h1>
				<div className="grid grid-cols-5 gap-4">
					<div className="col-span-5 md:col-span-3 lg:col-span-3 pt-5">
						<div className="text-primary-foreground lg:max-w-[100%] prose dark:prose-invert">
							<p>
								Sometimes I make games, they're not super amazing, but I
								thought I'd share a few here anyway, you can check them out below.
							</p>
							<p>
								Note: I've only just started doing this, so there's not many games
								yet.
							</p>
						</div>
					</div>
				</div>

				<h2 className="text-xl md:text-2xl font-bold text-primary-foreground mt-8 mb-4">
					What I've made
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<LinkCard
						icon={<Brush className="w-6 h-6" />}
						title="Anyone Can Draw"
						description="A game where you play against others and AI to get the highest score guessing what others drew."
						href="/games/anyone-can-draw"
					/>
					<LinkCard
						icon={<Circle className="w-6 h-6" />}
						title="Plot Twist (WIP)"
						description="A game where you collaborate with others to create a story, then vote on the best ending."
						href="/games/plot-twist"
					/>
				</div>
			</InnerPage>
		</PageLayout>
	);
}
