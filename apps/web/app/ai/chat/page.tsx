import { PageLayout } from "@/components/PageLayout";
import { ChatInterface } from "@/components/ChatInterface";
import { InnerPage } from "@/components/InnerPage";
import { getChatKeys } from "@/lib/data/chat";
import {
	onCreateChat,
	onChatSelect,
	onNewChat,
	onReaction,
	onTranscribe,
} from "@/actions/chat";
import { getAuthSession } from "@/lib/auth";
import { SignInForm } from "@/components/SignInForm";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Chat",
	description: "Start a chat with my assistant.",
};

async function getData(email: string) {
	const chatHistory = await getChatKeys({ email });
	return { chatHistory };
}

export default async function Chat() {
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
							<SignInForm />
						</div>
					</div>
				</InnerPage>
			</PageLayout>
		);
	}

	const isUserMe = user?.username === "nicholasgriffintn";

	if (!isUserMe) {
		return (
			<PageLayout>
				<InnerPage>
					<h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
						Unauthorized
					</h1>
					<p>Sorry, I'm only making this available to me for now.</p>
				</InnerPage>
			</PageLayout>
		);
	}

	const data = await getData(user.email);

	return (
		<PageLayout>
			<InnerPage isFullPage>
				<div className="container">
					<ChatInterface
						initialChatKeys={data.chatHistory}
						onSendMessage={onCreateChat}
						onChatSelect={onChatSelect}
						onNewChat={onNewChat}
						onReaction={onReaction}
						onTranscribe={onTranscribe}
					/>
				</div>
			</InnerPage>
		</PageLayout>
	);
}
