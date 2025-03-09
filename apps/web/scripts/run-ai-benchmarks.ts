// @ts-nocheck
import fs from "node:fs";

import { clock } from "./images";

const benchmarks = [
	{
		id: "hamster-svg",
		type: "text",
		prompt: "Generate an SVG of a hamster running on a wheel",
		description:
			"A standardised test to see how well LLMs can generate SVGs. Note: For all of these, I keep the conversation going until the model provides a useable SVG, even if that SVG is blank.",
	},
	{
		id: "system-design",
		type: "text",
		prompt:
			"Create a detailed system design for a scalable web application using AWS.",
		description:
			"A standardised test to see how well LLMs can create detailed system designs, while also testing its knowledge.",
	},
	{
		id: "multi-part-scenario",
		type: "text",
		prompt:
			"Please solve the following multi-part scenario that requires: Analytical reasoning, Creative problem-solving, Ethical considerations, Technical explanation. Scenario: A mid-sized technology company is developing an autonomous drone system for environmental monitoring. They've identified three potentially conflicting objectives: Maximize ecological data collection, Minimize wildlife disruption, Optimize operational cost-efficiency. Tasks: 1. Design a comprehensive drone flight strategy addressing all three objectives 2. Explain your logical reasoning for key design choices 3. Identify potential ethical challenges in autonomous environmental monitoring 4. Provide a technical architecture overview that demonstrates feasibility 5. Suggest potential mitigation strategies for unintended consequences. Additional constraints: Use current technological capabilities, Consider environmental and regulatory implications, Propose a scalable solution.",
		description:
			"A standardised test to see how well LLMs can solve multi-part scenarios.",
	},
	{
		id: "role-play",
		type: "text",
		prompt:
			"You are an expert Dungeon Master (DM) for Dungeons & Dragons, known for creating immersive and captivating game experiences. Your task is to create a complete D&D setup for a game with four players. The campaign name for this adventure is:\n\n<campaign_name>\nThe tech leads of Azeroth\n</campaign_name>\n\nTo ensure a creative and impressive response, please follow these steps:\n\n1. Begin by brainstorming unique and imaginative elements for each aspect of the D&D setup. Wrap this process in <worldbuilding> tags:\n\n   a. List 5 unique elements for the adventure\n   b. List 5 interesting aspects of the world's history or culture\n   c. Create 4 character concepts with brief descriptions\n   d. Generate 3 potential names for each character concept\n\n2. After brainstorming, select the best ideas from each category and explain why they were chosen. Wrap this in <idea_selection> tags.\n\n3. Using the selected ideas, create the following components for the D&D game:\n\n   a. Adventure: Develop a detailed and engaging adventure for the players to explore. Include a compelling plot, interesting locations, and potential encounters.\n\n   b. World Backstory: Craft a rich and immersive backstory for the world in which the adventure takes place. Consider its history, cultures, and any relevant conflicts or mysteries.\n\n   c. Character Backstories: Create detailed and engaging backstories for each of the four player characters. Ensure that their backgrounds are interconnected with the world and adventure you've created.\n\n   d. Character Names: Provide unique and fitting names for each of the four characters.\n\n4. Present your final D&D setup using the following structure:\n\n   <adventure>\n   [Detailed description of the adventure]\n   </adventure>\n\n   <world_backstory>\n   [Rich backstory of the game world]\n   </world_backstory>\n\n   <character_backstories>\n   [Detailed backstories for each of the four characters]\n   </character_backstories>\n\n   <character_names>\n   [List of names for each character]\n   </character_names>\n\nRemember to make each element as creative, detailed, and engaging as possible. Your goal is to create an impressive and immersive D&D experience that will captivate the players from the moment they begin.",
		description:
			"A standardised test to see how well LLMs can create a detailed and engaging Dungeons & Dragons campaign.",
	},
	{
		id: "what-is-the-time",
		type: "image-to-text",
		prompt: "What is the time?",
		description:
			"A standardised test to see if and how well LLMs can understand the time from an image. The expected output is `10:10:35`.",
		attachments: [
			{
				type: "image",
				url: clock,
			},
		],
	},
];

const textModels = [
	"gemini-2.0-flash",
	"gemini-experimental-1206",
	"gemini-1.5-flash",
	"gemini-1.5-pro",
	"gemini-1.5-flash-8b",
	"o1-preview",
	"o1-mini",
	"gpt-4o",
	"gpt-4o-mini",
	"gpt-4-turbo",
	"gpt-4",
	"gpt-3.5-turbo",
	"mistral-large",
	"mistral-small",
	"nova-lite",
	"nova-micro",
	"nova-pro",
	"claude-3.5-sonnet",
	"claude-3.5-haiku",
	"claude-3-opus",
	"grok",
	"llama-3.1-70b-instruct",
	"llama-3.2-1b-instruct",
	"llama-3.2-3b-instruct",
	"llama-3.3-70b-instruct",
	"mistral-nemo",
	"llama-3.1-sonar-small-128k-online",
	"codestral",
	"openchat",
	"una-cybertron-7b-v2",
	"tinyllama",
	"Phi-3.5-MoE-instruct",
	"Phi-3.5-mini-instruct",
	"mythomax-l2-13b",
	"deepseek-v3",
	"deepseek-chat",
	"deepseek-reasoner",
	"claude-3.7-sonnet",
];

const imageToTextModels = [
	"Phi-3.5-vision-instruct",
	"gemini-2.0-flash",
	"gpt-4o",
	"claude-3.5-sonnet",
	"claude-3-opus",
	"llava",
	"pixtral-large",
	"claude-3.7-sonnet",
];

const RATE_LIMIT = 50;
const TIME_WINDOW = 5 * 60 * 1000;
const DELAY_BETWEEN_REQUESTS = Math.ceil(TIME_WINDOW / RATE_LIMIT);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function validateBenchmarkResponse(benchmark: any, response: any) {
	if (!response) return { status: "failed", reason: "No response received" };

	if (benchmark.id === "hamster-svg") {
		const messages = Array.isArray(response)
			? response
			: response.response || [];

		const hasSvgTags = messages.some((message) => {
			const content = message.content || "";
			return content.includes("<svg") && content.includes("</svg>");
		});

		return {
			status: hasSvgTags ? "success" : "failed",
			reason: hasSvgTags ? null : "No valid SVG tags found in response",
		};
	}

	return { status: "success", reason: null };
}

async function fetchModelResponse(model: string, benchmark: any) {
	const request = {
		chatId: `benchmark-v1.2-${benchmark.id}-${model}`,
		message: benchmark.prompt,
		model,
		mode: "no_system",
		role: "user",
		max_tokens: 4096,
		timestamp: new Date().toISOString(),
	};

	const baseUrl = "https://chat-api.nickgriffin.uk";
	const token = process.env.AUTH_TOKEN;

	console.log(`Fetching data for ${request.chatId}`);

	try {
		const response = await fetch(`${baseUrl}/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"User-Agent": "NGWeb",
				Authorization: `Bearer ${token}`,
				"x-user-email": "automation@undefined.computer",
			},
			body: JSON.stringify({
				completion_id: request.chatId,
				messages: [	
					{
						role: "user",
						content: request.message,
					},
				],
				model: model,
				mode: request.mode,
				max_tokens: request.max_tokens,
				role: request.role,
				store: false,
				attachments: benchmark.attachments || undefined,
			}),
		});

		if (!response.ok) {
			console.error(
				`Error fetching data for ${request.chatId}:`,
				response.statusText,
			);
			console.log(response);
			return {
				model,
				request,
				response: null,
				status: "failed",
				reason: `HTTP ${response.status}: ${response.statusText}`,
			};
		}

		const responseData = await response.json();
		const validation = validateBenchmarkResponse(benchmark, responseData);

		return {
			model,
			request,
			response: responseData,
			...validation,
		};
	} catch (error) {
		return {
			model,
			request,
			response: null,
			status: "failed",
			reason: `Error: ${error.message}`,
		};
	}
}

async function processBatchWithRateLimit(models: string[], benchmark: any) {
	const results = [];
	const batchSize = 3;

	for (let i = 0; i < models.length; i += batchSize) {
		const batch = models.slice(i, i + batchSize);

		const batchResults = await Promise.all(
			batch.map((model) => fetchModelResponse(model, benchmark)),
		);
		results.push(...batchResults);

		if (i + batchSize < models.length) {
			await sleep(DELAY_BETWEEN_REQUESTS);
		}
	}

	return results;
}

async function run() {
	try {
		const existingBenchmarks = JSON.parse(
			fs.readFileSync("./lib/data/ai-benchmarks.json", "utf8"),
		);

		const newBenchmarkData = await Promise.all(
			benchmarks.map(async (benchmark) => {
				const modelsToUse =
					benchmark.type === "image-to-text" ? imageToTextModels : textModels;

				const existingBenchmark = existingBenchmarks.find(
					(existing) => existing.prompt === benchmark.prompt,
				);

				if (existingBenchmark) {
					const successfulModels = existingBenchmark.models.filter(
						(m) => m.status === "success",
					);

					const modelsToRun = modelsToUse.filter(
						(m) => !successfulModels.find((sm) => sm.model === m),
					);

					const newModelData = await processBatchWithRateLimit(
						modelsToRun,
						benchmark,
					);

					return {
						...existingBenchmark,
						models: [...successfulModels, ...newModelData],
					};
				}

				const modelData = await processBatchWithRateLimit(
					modelsToUse,
					benchmark,
				);

				return {
					...benchmark,
					models: modelData,
				};
			}),
		);

		fs.writeFileSync(
			"./lib/data/ai-benchmarks.json",
			JSON.stringify(newBenchmarkData, null, 2),
		);
	} catch (error) {
		console.error("Failed to run benchmarks:", error);
	}
}

run();
