import { useState } from "react";
import { Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GameState, User, GameListItem } from "../types";

interface GameStatusProps {
	users: Array<User>;
	gameState: GameState;
	availableGames: GameListItem[];
	onCreateGame: (name: string) => void;
	onJoinGame: (gameId: string) => void;
	onStartGame: () => void;
	onEndGame: () => void;
	onLeaveGame: () => void;
	isConnected: boolean;
	isDrawer: boolean;
}

export function GameStatus({
	users,
	gameState,
	availableGames,
	onCreateGame,
	onJoinGame,
	onStartGame,
	onEndGame,
	onLeaveGame,
	isConnected,
	isDrawer,
}: GameStatusProps) {
	const [newGameName, setNewGameName] = useState("");

	const getStatusBackground = (timeRemaining: number, hasWon: boolean) => {
		if (hasWon) return "bg-green-100 dark:bg-green-900";
		if (timeRemaining <= 30) return "bg-red-100 dark:bg-red-900";
		if (timeRemaining <= 60) return "bg-yellow-100 dark:bg-yellow-900";
		return "bg-blue-100 dark:bg-blue-900";
	};

	if (!gameState.gameId) {
		return (
			<div className="p-4 space-y-4">
				<div className="prose dark:prose-invert">
					<h3 className="text-lg font-medium">Drawing Game Lobby</h3>
					<p className="text-sm text-muted-foreground">
						Test your drawing skills! You'll be given a word to draw and have 2
						minutes to get the AI to guess it correctly.
					</p>
					<ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
						<li>You'll get a random word to draw</li>
						<li>AI will try to guess every few seconds</li>
						<li>Game ends when AI guesses correctly or time runs out</li>
					</ul>

					{isConnected ? (
						<>
							<div className="flex flex-col sm:flex-row gap-2 my-4">
								<Input
									value={newGameName}
									onChange={(e) => setNewGameName(e.target.value)}
									placeholder="Enter game name"
								/>
								<Button
									onClick={() => {
										onCreateGame(newGameName);
										setNewGameName("");
									}}
									disabled={!newGameName.trim()}
								>
									Create Game
								</Button>
							</div>

							{availableGames.length > 0 && (
								<div className="space-y-2">
									<h4 className="font-medium">Available Games:</h4>
									{availableGames.map((game) => (
										<div
											key={game.id}
											className={`flex items-center justify-between p-2 rounded-lg ${
												game.isLobby
													? "bg-muted"
													: "bg-yellow-100 dark:bg-yellow-900"
											}`}
										>
											<div>
												<div className="font-medium">{game.name}</div>
												<div className="text-sm text-muted-foreground">
													Players: {game.playerCount}
												</div>
											</div>
											<Button
												onClick={() => onJoinGame(game.id)}
												disabled={!game.isLobby}
												className="w-full sm:w-auto mt-2 sm:mt-0"
											>
												{game.isLobby ? "Join" : "In Progress"}
											</Button>
										</div>
									))}
								</div>
							)}
						</>
					) : (
						<div className="text-sm text-muted-foreground">
							Connecting to server...
						</div>
					)}
				</div>
			</div>
		);
	}

	if (gameState.isLobby) {
		return (
			<div className="p-4 space-y-4">
				<div className="prose dark:prose-invert">
					<h3 className="text-lg font-medium">
						Game Lobby: {gameState.gameName}
					</h3>
					<p className="text-sm text-muted-foreground">
						Waiting for players to join...
					</p>
				</div>

				{gameState.gameId && (
					<div className="space-y-2">
						<h3 className="font-medium">Players:</h3>
						<div className="space-y-1">
							{users
								.filter((user) => user.id !== "ai-player")
								.sort((a, b) => b.score - a.score)
								.map((user, index) => {
									const getBgColor = () => {
										if (index === 0 && user.score > 0)
											return "bg-yellow-100 dark:bg-yellow-900";
										if (index === 1 && user.score > 0)
											return "bg-slate-200 dark:bg-slate-800";
										if (index === 2 && user.score > 0)
											return "bg-amber-100 dark:bg-amber-900";
										return "bg-muted";
									};

									return (
										<div
											key={user.id}
											className={`text-sm p-2 rounded-md flex justify-between items-center transition-colors ${getBgColor()}`}
										>
											<span className="flex items-center gap-2">
												{index === 0 && user.score > 0 && "👑"}
												{user.name}
											</span>
											<span className="font-medium">Score: {user.score}</span>
										</div>
									);
								})}
						</div>
					</div>
				)}

				<div className="flex flex-col sm:flex-row gap-2">
					<Button
						onClick={onStartGame}
						disabled={users.length < 2}
						className="flex-1"
					>
						Start Game
					</Button>
					<Button onClick={onLeaveGame} variant="outline" className="flex-1">
						Leave Game
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`p-4 rounded-lg transition-colors ${getStatusBackground(
				gameState.timeRemaining,
				gameState.hasWon,
			)}`}
		>
			<div className="space-y-4">
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<span className="text-lg font-medium">
							{gameState.hasWon ? "You Won!" : isDrawer ? "Draw:" : "Guess the drawing:"}
						</span>
						<Timer className="h-5 w-5" />
					</div>
					{isDrawer && (
						<span className="text-2xl font-bold">{gameState.targetWord}</span>
					)}
					<div className="flex flex-col">
						<span className="text-xs">Time Remaining:</span>
						<span className="text-2xl font-bold">
							{Math.floor(gameState.timeRemaining / 60)}:
							{(gameState.timeRemaining % 60).toString().padStart(2, "0")}
						</span>
					</div>
				</div>
				<Button onClick={onEndGame} variant="outline" className="w-full">
					End Game
				</Button>
			</div>
		</div>
	);
}
