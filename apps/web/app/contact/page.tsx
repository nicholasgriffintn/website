import { PageLayout } from "@/components/PageLayout";
import { ContactLinks } from "@/components/ContactLinks";
import { InnerPage } from "@/components/InnerPage";
import { ContactForm } from "@/components/ContactForm";

// TODO: Add form: https://github.com/nicholasgriffintn/NGWebsite2021/blob/16930e6c23a6a57a2ff61c1f802bcdd2c35aced4/src/pages/contact.js

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
							<ContactLinks />
						</div>
					</div>
				</div>
				<hr className="my-4" />
				<ContactForm />
				<hr className="my-4" />
				<small>
					If you prefer email clients over forms you can send me a message{" "}
					{/* biome-ignore lint/a11y/useValidAnchor: We're obfuscating the email address */}
					<a href="javascript:window.location.href=atob('bWFpbHRvOm1lQG5pY2tncmlmZmluLnVr')">
						here
					</a>
					.
				</small>
			</InnerPage>
		</PageLayout>
	);
}
