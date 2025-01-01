"use client";

import { useNarrativeGame } from "./hooks/useNarrativeGame";
import { StoryContribution } from "./StoryContribution";
import { AISuggestions } from "./AISuggestions";
import { StatusMessage } from "./StatusMessage";
import { GameLobby } from "./GameLobby";

interface Props {
	playerId: string;
	playerName: string;
	initialGameId?: string;
}

function NarrativeGameInner({
	gameState,
	availableGames,
	createGame,
	joinGame,
	isLoading,
	users,
	submitThemeVote,
	startGame,
	endGame,
	leaveGame,
	submitContribution,
	voteOnSuggestion,
	requestAIIntervention,
	playerId,
}: {
	gameState: any;
	availableGames: any[];
	createGame: (gameName: string) => Promise<void>;
	joinGame: (gameId: string) => void;
	isLoading: boolean;
	users: any[];
	submitThemeVote: (theme: string) => void;
	startGame: (theme: string) => void;
	endGame: () => void;
	leaveGame: () => void;
	submitContribution: (contribution: string) => void;
	voteOnSuggestion: (suggestionIndex: number) => void;
	requestAIIntervention: () => void;
	playerId: string;
}) {
	if (!gameState.gameId) {
		return (
			<GameLobby
				availableGames={availableGames}
				onCreateGame={createGame}
				onJoinGame={joinGame}
				isLoading={isLoading}
			/>
		);
	}

	if (gameState.isLobby) {
		return (
			<GameLobby
				availableGames={[]}
				onCreateGame={createGame}
				onJoinGame={joinGame}
				gameState={gameState}
				onSubmitTheme={submitThemeVote}
				onStartGame={startGame}
				users={users}
				isLoading={isLoading}
			/>
		);
	}

	return (
		<>
			{(gameState.hasEnded || gameState.isReviewPhase) && (
				<div className="mb-6 bg-green-50 rounded-lg p-6 border border-green-200">
					<h3 className="text-2xl font-bold mb-4 text-green-800">
						Game Complete! 🎉
					</h3>
					<div className="space-y-3">
						<h4 className="font-medium text-lg text-green-700 mb-2">
							Final Scores:
						</h4>
						{users
							.sort((a, b) => b.score - a.score)
							.map((user) => (
								<div
									key={user.id}
									className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm"
								>
									<span className="font-medium text-foreground">
										{user.name}
									</span>
									<span className="text-lg font-bold text-green-600">
										{user.score} points
									</span>
								</div>
							))}
					</div>
				</div>
			)}

			<div className="mb-8">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-xl font-bold">
						{gameState.storyPrompt || "Loading story..."}
					</h2>
					{gameState.isActive &&
						!gameState.hasEnded &&
						!gameState.isReviewPhase && (
							<button
								type="button"
								onClick={endGame}
								disabled={isLoading}
								className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 disabled:bg-gray-400 transition-colors"
							>
								End Game
							</button>
						)}
				</div>

				<div className="space-y-6">
					{gameState.contributions.map((contribution) => (
						<StoryContribution
							key={`${contribution.playerId}-${contribution.timestamp}`}
							contribution={contribution}
							user={users.find((u) => u.id === contribution.playerId)}
						/>
					))}
				</div>
			</div>

			{!gameState.hasEnded && !gameState.isReviewPhase && (
				<>
					<button
						type="button"
						onClick={leaveGame}
						className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 disabled:bg-gray-400 transition-colors"
					>
						Leave Game
					</button>

					<div className="mb-6">
						<div className="flex items-center justify-between p-4 bg-card rounded-lg">
							<div>
								<span className="font-medium text-muted-foreground">
									Current Turn:{" "}
								</span>
								<span className="text-foreground font-bold">
									{users.find((u) => u.id === gameState.currentTurn)?.name ||
										"Loading..."}
									{gameState.currentTurn === playerId && " (You)"}
								</span>
							</div>
							<div>
								<span className="font-medium text-muted-foreground">
									Game Status:{" "}
								</span>
								<span
									className={`font-bold ${gameState.isActive ? "text-green-600" : "text-red-600"}`}
								>
									{gameState.isActive ? "Active" : "Inactive"}
								</span>
							</div>
						</div>
					</div>

					{gameState.isActive && gameState.currentTurn === playerId ? (
						<div className="mb-8">
							<div className="mb-3 text-lg font-medium text-green-600">
								🎲 It's your turn to contribute!
							</div>
							<form
								onSubmit={(e) => {
									e.preventDefault();
									const formData = new FormData(e.currentTarget);
									const contribution = formData.get("contribution") as string;
									if (contribution?.trim()) {
										submitContribution(contribution);
										e.currentTarget.reset();
									}
								}}
								className="space-y-4"
							>
								<textarea
									name="contribution"
									className="w-full p-4 bg-card border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									placeholder="Add to the story..."
									disabled={isLoading}
									rows={4}
									required
								/>
								<div className="flex justify-end">
									<button
										type="submit"
										disabled={isLoading}
										className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-400 transition-colors"
									>
										{isLoading ? "Submitting..." : "Submit Story"}
									</button>
								</div>
							</form>
						</div>
					) : (
						gameState.isActive && (
							<div className="mb-8 p-6 bg-card rounded-lg text-center">
								<p className="text-muted-foreground text-lg">
									Waiting for{" "}
									<span className="font-bold">
										{users.find((u) => u.id === gameState.currentTurn)?.name}
									</span>{" "}
									to contribute...
								</p>
							</div>
						)
					)}

					{gameState.aiSuggestions.length > 0 && (
						<div className="mb-8">
							<AISuggestions
								suggestions={gameState.aiSuggestions}
								onVote={voteOnSuggestion}
								isLoading={isLoading}
							/>
						</div>
					)}

					{gameState.isActive && (
						<div className="flex justify-center">
							<button
								type="button"
								onClick={requestAIIntervention}
								disabled={
									isLoading ||
									(!!gameState.aiCooldownEnd &&
										gameState.aiCooldownEnd > Date.now())
								}
								className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 hover:text-muted-foreground disabled:bg-gray-400 disabled:text-muted-foreground transition-colors"
							>
								{isLoading ? "Loading..." : "Request AI Help"}
							</button>
						</div>
					)}
				</>
			)}
		</>
	);
}

export function NarrativeGame({ playerId, playerName, initialGameId }: Props) {
	const {
		gameState,
		users,
		isLoading,
		availableGames,
		statusMessage,
		createGame,
		submitContribution,
		voteOnSuggestion,
		requestAIIntervention,
		joinGame,
		startGame,
		submitThemeVote,
		endGame,
		leaveGame,
	} = useNarrativeGame(playerId, playerName);

	return (
		<div className="w-full">
			{statusMessage && (
				<div className="mb-6">
					<StatusMessage
						type={statusMessage.type}
						message={statusMessage.message}
					/>
				</div>
			)}

			<NarrativeGameInner
				gameState={gameState}
				availableGames={availableGames}
				createGame={createGame}
				joinGame={joinGame}
				isLoading={isLoading}
				users={users}
				submitThemeVote={submitThemeVote}
				startGame={startGame}
				endGame={endGame}
				leaveGame={leaveGame}
				submitContribution={submitContribution}
				voteOnSuggestion={voteOnSuggestion}
				requestAIIntervention={requestAIIntervention}
				playerId={playerId}
			/>
		</div>
	);
}
