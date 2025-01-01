import { PageLayout } from "@/components/PageLayout";
import { InnerPage } from "@/components/InnerPage";
import { PlotTwist } from "@/components/apps/PlotTwist";
import { getAuthSession } from "@/lib/auth";
import { SignInForm } from "@/components/SignInForm";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Plot Twist",
	description:
		"A game where you collaborate with others to create a story, then vote on the best ending.",
};

export default async function PlotTwistHome() {
	const { user } = await getAuthSession({
		refreshCookie: false,
	});

	if (!user) {
		return (
			<PageLayout>
				<InnerPage>
					<h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
						Unauthorized
					</h1>
					<div className="grid grid-cols-5 gap-4">
						<div className="col-span-5 md:col-span-3 lg:col-span-3 pt-5">
							<p className="text-red-600">
								Access denied. Please login to access this page.
							</p>
							<SignInForm redirectUrl="/games/plot-twist" />
						</div>
					</div>
				</InnerPage>
			</PageLayout>
		);
	}

	return (
		<PageLayout>
			<InnerPage>
				<h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
					Plot Twist
				</h1>
				<div className="grid grid-cols-5 gap-4">
					<div className="col-span-5 md:col-span-3 lg:col-span-4 pt-5">
						<div className="text-primary-foreground lg:max-w-[75%]">
							<p>
								This is a game where you collaborate with others to create a
								story, then vote on the best ending.
							</p>
						</div>
					</div>
				</div>
				<PlotTwist user={user} />
			</InnerPage>
		</PageLayout>
	);
}
