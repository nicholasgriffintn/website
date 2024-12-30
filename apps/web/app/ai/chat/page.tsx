import { redirect } from "next/navigation";

import { PageLayout } from "@/components/PageLayout";
import { ChatInterface } from "@/components/ChatInterface";
import { InnerPage } from "@/components/InnerPage";
import { getChatKeys } from "@/lib/data/chat";
import { handleTokenLogin } from '@/actions/auth';
import { validateToken } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import {
	onCreateChat,
	onChatSelect,
	onNewChat,
	onReaction,
	onTranscribe,
} from "@/actions/chat";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Chat",
	description: "Start a chat with my assistant.",
};

async function getData(token: string) {
	const chatHistory = await getChatKeys({ token });
	return { chatHistory };
}

export default async function Chat({ searchParams }) {
	const searchParamValues = await searchParams;
	const urlToken = searchParamValues.token as string | undefined;

	if (urlToken) {
		redirect(`/api/auth?token=${urlToken}&redirect=/chat`);
	}

	const token = await validateToken();

	if (!token) {
		return (
      <PageLayout>
        <InnerPage>
          <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
            Unauthorized
          </h1>
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-5 md:col-span-3 lg:col-span-3 pt-5">
              <p className="text-red-600">
                Access denied. Please enter a valid token.
              </p>
              <LoginForm onSubmit={handleTokenLogin} redirectUrl="/chat" />
            </div>
          </div>
        </InnerPage>
      </PageLayout>
    );
	}

	const data = await getData(token || "");

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
