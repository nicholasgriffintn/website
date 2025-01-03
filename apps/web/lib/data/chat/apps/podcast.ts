export async function uploadPodcast({
	token,
	audioUrl,
}: {
	token: string;
	audioUrl?: string;
}): Promise<any> {
	try {
		if (!token) {
			throw new Error("No token provided");
		}

		const baseUrl =
			process.env.NODE_ENV === "development"
				? "http://localhost:8787"
				: "https://assistant.nicholasgriffin.workers.dev";

		const res = await fetch(`${baseUrl}/apps/podcasts/upload`, {
			method: "POST",
			headers: {
				"User-Agent": "NGWeb",
				Authorization: `Bearer ${token}`,
				"x-user-email": "anonymous@undefined.computer",
			},
			body: JSON.stringify({
				audioUrl,
			}),
		});

		if (!res.ok) {
			console.error("Error fetching data from AI", res.statusText);
			throw new Error("Error fetching data from AI");
		}

		const data: any = await res.json();

		return data;
	} catch (error) {
		console.error("Error transcribing audio", error);
		throw new Error("Error transcribing audio");
	}
}

export async function transcribePodcast({
	token,
	chatId,
	prompt,
	numberOfSpeakers,
}: {
	token: string;
	chatId: string;
	prompt: string;
	numberOfSpeakers: number;
}): Promise<any> {
	try {
		if (!token) {
			console.error("No token provided");
			return;
		}

		const baseUrl =
			process.env.NODE_ENV === "development"
				? "http://localhost:8787"
				: "https://assistant.nicholasgriffin.workers.dev";
		const res = await fetch(`${baseUrl}/apps/podcasts/transcribe`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"User-Agent": "NGWeb",
				Authorization: `Bearer ${token}`,
				"x-user-email": "anonymous@undefined.computer",
			},
			body: JSON.stringify({
				podcastId: chatId,
				prompt,
				numberOfSpeakers,
			}),
		});

		if (!res.ok) {
			console.error("Error fetching data from AI", res.statusText);
			return;
		}

		const data = await res.json();
		return data;
	} catch (error) {
		console.error("Error sending feedback", error);
	}
}

export async function summarisePodcast({
	token,
	chatId,
	speakers,
}: {
	token: string;
	chatId: string;
	speakers: Record<string, string>;
}): Promise<any> {
	try {
		if (!token) {
			console.error("No token provided");
			return;
		}

		const baseUrl =
			process.env.NODE_ENV === "development"
				? "http://localhost:8787"
				: "https://assistant.nicholasgriffin.workers.dev";
		const res = await fetch(`${baseUrl}/apps/podcasts/summarise`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"User-Agent": "NGWeb",
				Authorization: `Bearer ${token}`,
				"x-user-email": "anonymous@undefined.computer",
			},
			body: JSON.stringify({
				podcastId: chatId,
				speakers,
			}),
		});

		if (!res.ok) {
			console.error("Error fetching data from AI", res.statusText);
			return;
		}

		const data = await res.json();

		return data;
	} catch (error) {
		console.error("Error sending feedback", error);
	}
}

export async function generatePodcastImage({
	token,
	chatId,
}: {
	token: string;
	chatId: string;
}): Promise<any> {
	try {
		if (!token) {
			console.error("No token provided");
			return;
		}

		const baseUrl =
			process.env.NODE_ENV === "development"
				? "http://localhost:8787"
				: "https://assistant.nicholasgriffin.workers.dev";
		const res = await fetch(`${baseUrl}/apps/podcasts/generate-image`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"User-Agent": "NGWeb",
				Authorization: `Bearer ${token}`,
				"x-user-email": "anonymous@undefined.computer",
			},
			body: JSON.stringify({
				podcastId: chatId,
			}),
		});

		if (!res.ok) {
			console.error("Error fetching data from AI", res.statusText);
			return;
		}

		const data = await res.json();

		return data;
	} catch (error) {
		console.error("Error sending feedback", error);
	}
}
