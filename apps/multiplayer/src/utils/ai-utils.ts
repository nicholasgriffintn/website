import type { Env } from "../types";

const usedGuesses = new Set<string>();

export async function onAIGuessDrawing(drawingData: string, env: Env) {
	const base64Data = drawingData.replace(/^data:image\/\w+;base64,/, "");
	const binaryData = new Uint8Array(
		atob(base64Data)
			.split("")
			.map((char) => char.charCodeAt(0)),
	);

	const guessRequest = await env.AI.run(
		"@cf/llava-hf/llava-1.5-7b-hf",
		{
			prompt: `You will be provided with a description of an image. Your task is to guess what the image depicts using only one word. Follow these steps:

1. Carefully review the image provided.

2. Based on the image, think about the most likely object, animal, place, food, activity, or concept that the image represents.

3. Choose a single word that best describes or identifies the main subject of the image.

4. Provide your guess as a single word response. Do not include any explanations, punctuation, or additional text.

IMPORTANT: Do not use any of these previously guessed words: ${Array.from(
				usedGuesses,
			).join(", ")}

Your response should contain only one word, which represents your best guess for the image described. Ensure that your answer is concise and accurately reflects the main subject of the image.`,
			image: [...binaryData],
		},
		{},
	);

	if (!guessRequest.description) {
		return { guess: null };
	}

	if (usedGuesses.has(guessRequest.description.trim().toLowerCase())) {
		return { guess: null };
	}

	usedGuesses.add(guessRequest.description.trim().toLowerCase());

	const guess = guessRequest.description.trim().toLowerCase();

	return { guess };
}
