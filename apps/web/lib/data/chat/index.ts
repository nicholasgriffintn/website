import type { ChatList, ChatMessage, ChatMode, ChatRole } from "@/types/chat";
import { defaultModel } from "@/lib/ai/models";

export async function getChatKeys({
	email,
}: {
	email: string;
}): Promise<ChatList | undefined> {
	try {
		if (!email) {
			console.error("No email provided");
			return;
		}

		const token = process.env.AUTH_TOKEN;

		if (!token) {
			console.error("No token set");
			return;
		}

		const baseUrl =
			process.env.NODE_ENV === "development"
				? "http://localhost:8787"
				: "https://assistant.nicholasgriffin.workers.dev";
		const url = `${baseUrl}/chat`;

		const res = await fetch(url, {
			headers: {
				"Content-Type": "application/json",
				"User-Agent": "NGWeb",
				Authorization: `Bearer ${token}`,
				"x-user-email": email,
			},
		});

		if (!res.ok) {
			console.error("Error fetching data from AI", res.statusText);
			return;
		}

		const data: any = await res.json();

		const keys = data?.response?.keys;

		if (!keys) {
			console.error("No keys found in response");
			return;
		}

		const chatList = keys?.map((chat) => {
			return {
				...chat,
				id: chat.id || chat.name,
				title: chat.title || chat.name || "",
			};
		});

		return chatList;
	} catch (error) {
		console.error("Error getting chat keys", error);
	}
}

export async function getChat({
	id,
	token,
}: {
	id: string;
	token: string;
}): Promise<ChatMessage[]> {
	try {
		if (!token || !id) {
			console.error("No token or id provided");
			return [];
		}

		const baseUrl =
			process.env.NODE_ENV === "development"
				? "http://localhost:8787"
				: "https://assistant.nicholasgriffin.workers.dev";
		const url = `${baseUrl}/chat/${encodeURIComponent(id)}`;

		const res = await fetch(url, {
			headers: {
				"Content-Type": "application/json",
				"User-Agent": "NGWeb",
				Authorization: `Bearer ${token}`,
				"x-user-email": "anonymous@undefined.computer",
			},
		});

		if (!res.ok) {
			console.error("Error fetching data from AI", res.statusText);
			return [];
		}

		const data: ChatMessage[] = await res.json();

		return data;
	} catch (error) {
		console.error("Error getting chat", error);
		return [];
	}
}

export async function createChat({
	token,
	chatId,
	message,
	model,
	mode = "remote",
	role = "user",
}: {
	token: string;
	chatId: string;
	message: string;
	model?: string;
	mode: ChatMode;
	role: ChatRole;
}): Promise<ChatMessage[]> {
	try {
		if (!token || !chatId || !message) {
			console.error("No token provided");
			return [];
		}

		const baseUrl =
			process.env.NODE_ENV === "development"
				? "http://localhost:8787"
				: "https://assistant.nicholasgriffin.workers.dev";

		const res = await fetch(`${baseUrl}/chat`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"User-Agent": "NGWeb",
				Authorization: `Bearer ${token}`,
				"x-user-email": "anonymous@undefined.computer",
			},
			body: JSON.stringify({
				chat_id: chatId,
				input:
					model === "flux"
						? {
								prompt: message,
							}
						: message,
				date: new Date().toISOString(),
				model: model || defaultModel,
				mode,
				role,
			}),
		});

		if (!res.ok) {
			console.error("Error fetching data from AI", res.statusText);
			return [];
		}

		const data: ChatMessage[] = await res.json();

		return data;
	} catch (error) {
		console.error("Error creating chat", error);
		return [];
	}
}

export async function sendTranscription({
	token,
	audio,
}: {
	token: string;
	audio: Blob;
}): Promise<string> {
	try {
		if (!token || !audio) {
			throw new Error("No token provided");
		}

		const baseUrl =
			process.env.NODE_ENV === "development"
				? "http://localhost:8787"
				: "https://assistant.nicholasgriffin.workers.dev";

		const formData = new FormData();
		formData.append("audio", audio);

		const res = await fetch(`${baseUrl}/chat/transcribe`, {
			method: "POST",
			headers: {
				"User-Agent": "NGWeb",
				Authorization: `Bearer ${token}`,
				"x-user-email": "anonymous@undefined.computer",
			},
			body: formData,
		});

		if (!res.ok) {
			console.error("Error fetching data from AI", res.statusText);
			throw new Error("Error fetching data from AI");
		}

		const data: {
			response: {
				content: string;
			};
		} = await res.json();

		return data.response.content;
	} catch (error) {
		console.error("Error transcribing audio", error);
		throw new Error("Error transcribing audio");
	}
}

export async function sendFeedback({
	token,
	logId,
	feedback,
}: {
	token: string;
	logId: string;
	feedback: string;
}): Promise<void> {
	try {
		if (!token || !logId || !feedback) {
			console.error("No token provided");
			return;
		}

		const baseUrl =
			process.env.NODE_ENV === "development"
				? "http://localhost:8787"
				: "https://assistant.nicholasgriffin.workers.dev";
		const res = await fetch(`${baseUrl}/chat/feedback`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"User-Agent": "NGWeb",
				Authorization: `Bearer ${token}`,
				"x-user-email": "anonymous@undefined.computer",
			},
			body: JSON.stringify({
				logId,
				feedback: feedback === "positive" ? 1 : -1,
			}),
		});

		if (!res.ok) {
			console.error("Error fetching data from AI", res.statusText);
			return;
		}

		const data = await res.json();
	} catch (error) {
		console.error("Error sending feedback", error);
	}
}
