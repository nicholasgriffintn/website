import type { GameState } from "../types";

export function Chat({
	gameState,
	onGuess,
	isDrawer,
}: {
	gameState: GameState;
	onGuess?: (guess: string) => Promise<any>;
	isDrawer: boolean;
}) {
	const handleGuess = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const guess = formData.get("guess") as string;
		await onGuess?.(guess);
	};

	return (
		<div className="bg-muted p-4 rounded-lg flex-1">
			<h3 className="font-medium mb-2">Game Guesses:</h3>
			<div className="space-y-2 max-h-[400px] overflow-y-auto">
				{gameState.guesses.map((guess, index) => (
					<div
						key={index}
						className={`text-sm p-2 rounded ${
							guess.correct ? "bg-green-100 dark:bg-green-900" : "bg-background"
						}`}
					>
						<span className="font-medium">{guess.playerName}:</span>{" "}
						{guess.correct && !isDrawer ? `✨ You guessed correctly with ${guess.guess}! ✨` : guess.guess}
					</div>
				))}
				{!isDrawer && (
					<form onSubmit={handleGuess} className="mt-4 flex gap-2">
						<input
							type="text"
							name="guess"
							placeholder="Enter your guess..."
							className="flex-1 rounded-md border px-3 py-2"
							autoComplete="off"
						/>
						<button
							type="submit"
							className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
						>
							Guess
						</button>
					</form>
				)}
			</div>
		</div>
	);
}
