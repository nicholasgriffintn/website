"use server";

import {
	uploadPodcast,
	transcribePodcast,
	summarisePodcast,
	generatePodcastImage,
} from "@/lib/data/chat/apps/podcast";
import {
	getChat,
	createChat,
	sendFeedback,
	sendTranscription,
} from "@/lib/data/chat";
import type { ChatMode, ChatRole } from "@/types/chat";

export async function onGenerateDrawing(drawingData: string) {
	try {
		const token = process.env.AUTH_TOKEN;
		if (!token) {
			throw new Error("No token set");
		}

		const baseUrl =
			process.env.NODE_ENV === "development"
				? "http://localhost:8787"
				: "https://assistant.nicholasgriffin.workers.dev";

		const base64Data = drawingData.replace(/^data:image\/\w+;base64,/, "");
		const binaryData = Buffer.from(base64Data, "base64");
		const blob = new Blob([binaryData], { type: "image/png" });

		const formData = new FormData();
		formData.append("drawing", blob, "drawing.png");

		const res = await fetch(`${baseUrl}/apps/drawing`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"User-Agent": "NGWeb",
				"x-user-email": "anonymous@undefined.computer",
			},
			body: formData,
		});

		if (!res.ok) {
			console.error("Failed to submit drawing", res);
			throw new Error("Failed to submit drawing");
		}

		const data = await res.json();
		return data;
	} catch (error) {
		console.error("Error generating drawing", error);
		throw new Error("Error generating drawing");
	}
}

export async function onUploadPodcast(audioUrl) {
	const token = process.env.AUTH_TOKEN;
	if (!token) {
		throw new Error("No token set");
	}

	const response = await uploadPodcast({
		token,
		audioUrl,
	});

	if (!response) {
		throw new Error("No response from the model");
	}

	return response;
}

export async function onTranscribePodcast(
	chatId: string,
	prompt: string,
	numberOfSpeakers: number,
) {
	const token = process.env.AUTH_TOKEN;
	if (!token) {
		throw new Error("No token set");
	}

	const response = await transcribePodcast({
		token,
		chatId,
		prompt,
		numberOfSpeakers,
	});

	if (!response) {
		throw new Error("No response from the model");
	}

	return response;
}

export async function onGetChat(chatId: string) {
	const token = process.env.AUTH_TOKEN;
	if (!token) {
		console.error("No token set");
		return [];
	}

	const chatMessages = await getChat({ token, id: chatId });
	return Array.isArray(chatMessages) ? chatMessages : [];
}

export async function onSummarisePodcast(
	chatId: string,
	speakers: Record<string, string>,
) {
	const token = process.env.AUTH_TOKEN;
	if (!token) {
		throw new Error("No token set");
	}

	const response = await summarisePodcast({
		token,
		chatId,
		speakers,
	});

	if (!response) {
		throw new Error("No response from the model");
	}

	return response;
}

export async function onGeneratePodcastImage(chatId: string) {
	const token = process.env.AUTH_TOKEN;
	if (!token) {
		throw new Error("No token set");
	}

	const response = await generatePodcastImage({
		token,
		chatId,
	});

	if (!response) {
		throw new Error("No response from the model");
	}

	return response;
}

export async function onCreateChat(
	chatId: string,
	message: string,
	model: string,
	mode: ChatMode = "remote",
	role: ChatRole = "user",
) {
	"use server";

	const token = process.env.AUTH_TOKEN;
	if (!token) {
		console.error("No token set");
		return [];
	}

	const response = await createChat({
		token,
		chatId,
		message,
		model,
		mode,
		role,
	});
	return Array.isArray(response) ? response : [response];
}

export async function onChatSelect(chatId: string) {
	"use server";

	const token = process.env.AUTH_TOKEN;
	if (!token) {
		console.error("No token set");
		return [];
	}

	const chatMessages = await getChat({ token, id: chatId });
	return Array.isArray(chatMessages) ? chatMessages : [];
}

export async function onNewChat(content: string) {
	"use server";

	if (!content) {
		return `New chat (${Math.random().toString(36).substring(7)})`;
	}

	const shortContent = content.trim().substring(0, 36);
	const contentTitle = `${shortContent}${
		content.length > shortContent.length ? "..." : ""
	}`;
	return contentTitle;
}

export async function onReaction(
	chatId: string,
	content: string,
	logId: string,
	reaction: string,
) {
	"use server";

	const token = process.env.AUTH_TOKEN;
	if (!token) {
		return;
	}

	if (reaction === "thumbsUp") {
		return await sendFeedback({ token, logId, feedback: "positive" });
	}

	if (reaction === "thumbsDown") {
		return await sendFeedback({ token, logId, feedback: "negative" });
	}
}

export async function onTranscribe(audio: Blob) {
	"use server";

	const token = process.env.AUTH_TOKEN;
	if (!token) {
		throw new Error("No token set");
	}

	const response = await sendTranscription({
		token,
		audio,
	});

	if (!response) {
		throw new Error("No response from the model");
	}

	return response;
}
