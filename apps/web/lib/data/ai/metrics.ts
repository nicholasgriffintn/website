import type { Metric } from "@/app/ai/metrics/types";

export async function getAiMetrics({
	token,
	status,
	limit,
	interval,
	timeframe,
}: {
	token: string;
	status: string;
	limit: number;
	interval: number;
	timeframe: number;
}): Promise<Metric[] | undefined> {
	try {
		const baseUrl =
			process.env.NODE_ENV === "development"
				? "http://localhost:8787"
				: "https://chat-api.nickgriffin.uk";
		const url = `${baseUrl}/metrics?status=${status}&limit=${limit}&interval=${interval}&timeframe=${timeframe}&type=performance`;

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
			return;
		}

		const data: {
			metrics: Metric[];
		} = await res.json();

		if (!data.metrics) {
			console.error("No metrics found in response");
			return;
		}

		return data.metrics.reverse();
	} catch (error) {
		console.error("Error getting AI metrics", error);
	}
}
