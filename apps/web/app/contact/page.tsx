import { PageLayout } from "@/components/PageLayout";
import { ContactLinks } from "@/components/ContactLinks";
import { InnerPage } from "@/components/InnerPage";
import { ContactForm } from "@/components/ContactForm";
import { Link } from "@/components/Link";

export const metadata = {
	title: "Contact",
	description: "Send me a message.",
};

export default async function Home() {
	return (
		<PageLayout>
			<InnerPage>
				<h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
					Send me a message
				</h1>
				<div className="grid grid-cols-5 gap-4">
					<div className="col-span-5 md:col-span-3 lg:col-span-4 pt-5">
						<div className="text-primary-foreground lg:max-w-[75%]">
							<p>I'm looking forward to hearing from you!</p>
							<p>
								Please fill in the form below to send me a message,
								alternatively, you can send me a message via one of the social
								networks below.
							</p>
							<p>
								If you are a recruiter then please head on over to LinkedIn
								instead where you may be ignored, unless you have a really
								interesting thing for me 🥸.
							</p>
							<ContactLinks hideContactLink />
						</div>
					</div>
				</div>
				<hr className="my-4" />
				<small>
					If you prefer email clients over forms you can send me a message at{" "}
					<Link href="mailto:me@nickgriffin.uk">me@nickgriffin.uk</Link>
					.
				</small>
				<hr className="my-4" />
				<ContactForm />
			</InnerPage>
		</PageLayout>
	);
}
