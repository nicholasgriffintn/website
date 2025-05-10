import { Brush, Spade, Lock } from "lucide-react";

import { PageLayout } from "@/components/PageLayout";
import { InnerPage } from "@/components/InnerPage";
import { LinkCard } from "@/components/LinkCard";

export const metadata = {
	title: "Apps",
	description: "A collection of apps that I am working on.",
};

export default async function Home() {
	return (
		<PageLayout>
			<InnerPage>
				<h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
					Apps
				</h1>
				<div className="grid grid-cols-5 gap-4">
					<div className="col-span-5 md:col-span-3 lg:col-span-3 pt-5">
						<div className="text-primary-foreground lg:max-w-[100%] prose dark:prose-invert">
							<p>
								Sometimes I make apps, they're not super amazing, but I
								thought I'd share a few here anyway, you can check them out below.
							</p>
							<p>
								Note: I've only just started doing this, so there's not many apps
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
						href="https://anyonecandraw.app"
						external
					/>
					<LinkCard
						icon={<Spade className="w-6 h-6" />}
						title="SprintJam"
						description="An app for running sprint poker sessions during your team's refinement sessions."
						href="https://sprintjam.co.uk"
						external
					/>
					<LinkCard
						icon={<Lock className="w-6 h-6" />}
						title="ThreatJam (WIP)"
						description="An app for running collaborative threat modelling sessions."
						href="https://threatjam.com"
						external
					/>
				</div>
			</InnerPage>
		</PageLayout>
	);
}
