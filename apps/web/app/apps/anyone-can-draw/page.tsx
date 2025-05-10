import { PageLayout } from "@/components/PageLayout";
import { InnerPage } from "@/components/InnerPage";
import { AnyoneCanDraw } from "@/components/AnyoneCanDraw";
import { Link } from "@/components/Link";
import { getAuthSession } from "@/lib/auth";
import { SignInForm } from "@/components/SignInForm";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Anyone Can Draw",
	description:
		"A drawing app that uses AI to generate paintings from your drawings or just play the guessing game.",
};

export default async function AnyoneCanDrawHome() {
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
							<SignInForm redirectUrl="/apps/anyone-can-draw" />
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
					Anyone Can Draw
				</h1>
				<div className="grid grid-cols-5 gap-4">
					<div className="col-span-5 md:col-span-3 lg:col-span-4 pt-5">
						<div className="text-primary-foreground lg:max-w-[75%]">
							<p>
								This is a drawing app that uses AI to generate paintings from
								your drawings. I also added a guessing game where AI will
								attempt to figure out what your drawing is, because that was
								fun. You can find out more about this app in{" "}
								<Link href="/blog/anyone-can-draw">this post</Link>.
							</p>
						</div>
					</div>
				</div>
				<AnyoneCanDraw user={user} />
			</InnerPage>
		</PageLayout>
	);
}
