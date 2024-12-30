import type {
	GameState,
	JoinRequest,
	StartGameRequest,
	GuessRequest,
	DrawingUpdateRequest,
	Env,
} from "./types";
import { GAME_WORDS } from "./constants";
import type { DurableObject, DurableObjectState } from "@cloudflare/workers-types";
import { onAIGuessDrawing } from "./utils/ai-utils";

export class Multiplayer implements DurableObject {
	private state: DurableObjectState;
	private env: Env;
	private games: Map<
		string,
		{
			name: string;
			users: Map<string, { name: string; score: number }>;
			gameState: GameState;
			timerInterval: number | null;
			lastAIGuessTime: number;
		}
	>;
	private readonly GAME_DURATION = 120;
	private readonly AI_PLAYER_ID = "ai-player";
	private readonly AI_GUESS_COOLDOWN = 10000;
	private readonly BASE_CORRECT_GUESSER_SCORE = 5;
	private readonly BASE_CORRECT_DRAWER_SCORE = 2;
	private readonly AI_NAMES = [
		"DoodleBot 🤖",
		"Pixel Picasso 🎨",
		"SketchSage 🎯",
		"The Guesstimator 🔍",
		"PixelProphet 🔮",
		"VisionBot 👁️",
		"DrawingDecoder 🎨",
		"ShapeShaman 🔻",
		"MasterpieceMind 🧠",
		"ArtOracle 🧞",
		"VisualVoyager 🚀",
		"PencilProdigy ✏️"
	];

	constructor(state: DurableObjectState, env: Env) {
		this.state = state;
		this.env = env;
		this.games = new Map();

		this.state.blockConcurrencyWhile(async () => {
			const storedGames = await this.state.storage.get("games");
			if (storedGames) {
				this.games = new Map(storedGames as [string, any][]);
				for (const [gameId, game] of this.games) {
					game.users = new Map(Array.from(game.users) as [string, any][]);
					game.timerInterval = null;
				}
			}
		});
	}

	async fetch(request: Request) {
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		this.state.acceptWebSocket(server);

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	async webSocketMessage(ws: WebSocket, message: string) {
		try {
			const data = JSON.parse(message);

			switch (data.action) {
				case "createGame":
					await this.handleCreateGame(data);
					break;
				case "getGames":
					ws.send(
						JSON.stringify({
							type: "gamesList",
							games: this.getGamesList(),
						}),
					);
					break;
				case "join":
					await this.handleJoin(data);
					break;
				case "leave":
					await this.handleLeave(data);
					break;
				case "startGame":
					await this.handleStartGame(data);
					break;
				case "submitGuess":
					await this.handleGuess(data);
					break;
				case "updateDrawing":
					await this.handleDrawingUpdate(data);
					break;
			}

			if (data.gameId) {
				const game = this.games.get(data.gameId);
				if (game) {
					this.broadcast(data.gameId, {
						type: "gameState",
						gameState: game.gameState,
					});
				}
			}
		} catch (error) {
			console.error("Error handling message:", error);
			ws.send(
				JSON.stringify({
					type: "error",
					error: "Invalid message format",
				}),
			);
		}
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string) {
		try {
			if (code !== 1006 && code >= 1000 && code < 5000) {
				ws.close(code, reason || "Durable Object is closing WebSocket");
			}
		} catch (error) {
			console.error("Error closing WebSocket:", error);
		}
	}

	private async handleCreateGame({
		gameName,
		playerId,
		playerName,
	}: {
		gameName: string;
		playerId: string;
		playerName: string;
	}) {
		try {
			const gameId = crypto.randomUUID();
			const randomAIName = this.AI_NAMES[Math.floor(Math.random() * this.AI_NAMES.length)];
			
			const newGame = {
				name: gameName,
				users: new Map([
					[this.AI_PLAYER_ID, { name: randomAIName, score: 0 }],
				]),
				gameState: {
					isActive: false,
					targetWord: "",
					timeRemaining: this.GAME_DURATION,
					guesses: [],
					hasWon: false,
					isLobby: true,
				},
				timerInterval: null,
				lastAIGuessTime: 0,
			};

			this.games.set(gameId, newGame);
			await this.handleJoin({ gameId, playerId, playerName });
			await this.state.storage.put("games", Array.from(this.games.entries()));

			this.broadcast(gameId, {
				type: "gameCreated",
				gameId,
				gameName,
				gameState: newGame.gameState,
			});

			return gameId;
		} catch (error) {
			console.error("Error creating game:", error);
			throw error;
		}
	}

	private async handleJoin({ gameId, playerId, playerName }: JoinRequest) {
		const game = this.games.get(gameId);
		if (!game) throw new Error("Game not found");

		if (!game.users.has(playerId)) {
			game.users.set(playerId, { name: playerName, score: 0 });
			await this.state.storage.put("games", Array.from(this.games.entries()));

			this.broadcast(gameId, {
				type: "playerJoined",
				playerId,
				playerName,
			});
		}
	}

	private async handleLeave({
		gameId,
		playerId,
	}: {
		gameId: string;
		playerId: string;
	}) {
		const game = this.games.get(gameId);
		if (!game) return;

		game.users.delete(playerId);
		await this.state.storage.put("games", Array.from(this.games.entries()));

		this.broadcast(gameId, {
			type: "playerLeft",
			playerId,
		});

		if (game.gameState.isActive && game.gameState.currentDrawer === playerId) {
			game.gameState.isActive = false;
			game.gameState.statusMessage = {
				type: "failure",
				message: "Game ended - drawer left the game",
			};
			await this.state.storage.put("games", Array.from(this.games.entries()));
		}
	}

	private async handleStartGame({
		gameId,
		playerId,
	}: { gameId: string } & StartGameRequest) {
		console.log("handleStartGame", gameId, playerId);
		console.log(this.games);
		const game = this.games.get(gameId);
		if (!game) throw new Error("Game not found");
		if (game.gameState.isActive) return;
		if (!game.gameState.isLobby || game.users.size < 2) return;

		const randomWord =
			GAME_WORDS[Math.floor(Math.random() * GAME_WORDS.length)];
		game.gameState = {
			isActive: true,
			isLobby: false,
			targetWord: randomWord,
			timeRemaining: this.GAME_DURATION,
			guesses: [],
			hasWon: false,
			currentDrawer: playerId,
			endTime: Date.now() + this.GAME_DURATION * 1000,
		};

		await this.state.storage.put("games", Array.from(this.games.entries()));
		this.startGameTimer(gameId);

		this.broadcast(gameId, {
			type: "gameStarted",
		});

		if (game.gameState.endTime) {
			await this.state.storage.setAlarm(game.gameState.endTime);
		}
	}

	private startGameTimer(gameId: string) {
		const game = this.games.get(gameId);
		if (!game) return;

		if (game.timerInterval) {
			clearInterval(game.timerInterval);
		}

		game.timerInterval = setInterval(async () => {
			if (!game.gameState.isActive) {
				if (game.timerInterval !== null) {
					clearInterval(game.timerInterval);
				}
				return;
			}

			const now = Date.now();
			if (game.gameState.endTime) {
				game.gameState.timeRemaining = Math.max(
					0,
					Math.ceil((game.gameState.endTime - now) / 1000),
				);

				this.broadcast(gameId, {
					type: "gameState",
					gameState: game.gameState,
					users: Array.from(game.users.entries()).map(([id, data]) => ({
						id,
						...data,
					})),
				});

				if (game.gameState.timeRemaining <= 0) {
					clearInterval(game.timerInterval);
				}

				if (game.gameState.drawingData) {
					const aiHasGuessedCorrectly = game.gameState.guesses.some(
						guess => guess.playerId === this.AI_PLAYER_ID && guess.correct
					);

					if (!aiHasGuessedCorrectly && now - game.lastAIGuessTime >= this.AI_GUESS_COOLDOWN) {
						try {
							const aiGuess = await onAIGuessDrawing(
								game.gameState.drawingData,
								this.env,
							);

							if (aiGuess.guess) {
								game.lastAIGuessTime = now;
								await this.handleGuess({
									gameId,
									playerId: this.AI_PLAYER_ID,
									guess: aiGuess.guess,
								});
							}
						} catch (error) {
							console.error("Error getting AI guess:", error);
						}
					}
				}
			}
		}, 1000) as unknown as number;
	}

	private async handleGuess({ gameId, playerId, guess }: GuessRequest) {
		try {
			const game = this.games.get(gameId);
			if (!game) throw new Error("Game not found");
			if (!game.gameState.isActive) return;

			const isCurrentDrawer = playerId === game.gameState.currentDrawer;
			if (isCurrentDrawer) return;

			const normalizedGuess = guess.trim().toLowerCase();
			const normalizedTarget = game.gameState.targetWord.toLowerCase();

			game.gameState.guesses.push({
				playerId,
				playerName: game.users.get(playerId)?.name || "Unknown Player",
				guess,
				timestamp: Date.now(),
				correct: normalizedGuess === normalizedTarget,
			});

			if (normalizedGuess === normalizedTarget) {
				const timeBasedScoreMultiplier =
					game.gameState.timeRemaining / this.GAME_DURATION;

				const guesser = game.users.get(playerId);
				if (guesser) {
					guesser.score +=
						this.BASE_CORRECT_GUESSER_SCORE * timeBasedScoreMultiplier;
				}

				const nonDrawerPlayers = Array.from(game.users.entries()).filter(
					([id]) =>
						id !== game.gameState.currentDrawer && id !== this.AI_PLAYER_ID,
				);
				const drawer = game.gameState.currentDrawer
					? game.users.get(game.gameState.currentDrawer)
					: undefined;
				if (drawer) {
					drawer.score +=
						this.BASE_CORRECT_DRAWER_SCORE *
						(timeBasedScoreMultiplier / nonDrawerPlayers.length);
				}

				const correctGuesses = new Set(
					game.gameState.guesses
						.filter((g) => g.correct)
						.map((g) => g.playerId),
				);

				const allPlayersGuessedCorrectly = nonDrawerPlayers.every(
					([playerId]) => correctGuesses.has(playerId),
				);

				if (allPlayersGuessedCorrectly) {
					game.gameState = {
						...game.gameState,
						hasWon: true,
						isActive: false,
						isLobby: true,
						targetWord: "",
						timeRemaining: this.GAME_DURATION,
						currentDrawer: undefined,
						endTime: undefined,
						statusMessage: {
							type: "success",
							message: `Everyone guessed correctly! The word was "${game.gameState.targetWord}"`,
						},
					};

					if (game.timerInterval) {
						clearInterval(game.timerInterval);
						game.timerInterval = null;
					}
				} else {
					game.gameState.statusMessage = {
						type: "success",
						message: `${
							game.users.get(playerId)?.name || "Unknown Player"
						} guessed correctly!`,
					};
				}
			}

			await this.state.storage.put(
				"games",
				Array.from(this.games.entries()).map(([id, gameData]) => [
					id,
					{
						...gameData,
						gameState: {
							...gameData.gameState,
							drawingData: undefined,
						},
					},
				]),
			);

			this.broadcast(gameId, {
				type: "guessSubmitted",
				gameState: game.gameState,
				users: Array.from(game.users.entries()).map(([id, data]) => ({
					id,
					...data,
				})),
			});
		} catch (error) {
			console.error("Error handling guess:", error);
			throw error;
		}
	}

	private async handleDrawingUpdate({
		gameId,
		drawingData,
	}: DrawingUpdateRequest) {
		try {
			const game = this.games.get(gameId);
			if (!game) throw new Error("Game not found");
			if (!game.gameState.isActive) return;

			game.gameState.drawingData = drawingData;

			await this.state.storage.put(
				"games",
				Array.from(this.games.entries()).map(([id, gameData]) => [
					id,
					{
						...gameData,
						gameState: {
							...gameData.gameState,
							drawingData: undefined,
						},
					},
				]),
			);

			this.broadcast(gameId, {
				type: "drawingUpdate",
				drawingData: game.gameState.drawingData,
			});
		} catch (error) {
			console.error("Error handling drawing update:", error);
			throw error;
		}
	}

	private broadcast(gameId: string, message: any) {
		const game = this.games.get(gameId);
		if (!game) return;

		if (message.gameState) {
			message.gameState = {
				...message.gameState,
				drawingData: undefined,
			};
		}

		const messageStr = JSON.stringify({
			...message,
			gameId,
			gameName: game.name,
			users: Array.from(game.users.entries()).map(([id, data]) => ({
				id,
				...data,
			})),
		});

		for (const ws of this.state.getWebSockets()) {
			try {
				ws.send(messageStr);
			} catch (error) {
				console.error("Error sending message to WebSocket:", error);
			}
		}
	}

	async alarm() {
		try {
			for (const [gameId, game] of this.games) {
				if (
					game.gameState.isActive &&
					game.gameState.endTime &&
					Date.now() >= game.gameState.endTime
				) {
					const oldWord = game.gameState.targetWord;
					game.gameState = {
						...game.gameState,
						isActive: false,
						isLobby: true,
						targetWord: "",
						timeRemaining: this.GAME_DURATION,
						currentDrawer: undefined,
						endTime: undefined,
						statusMessage: {
							type: "failure",
							message: `Time's up! The word was "${oldWord}"`,
						},
					};

					if (game.timerInterval) {
						clearInterval(game.timerInterval);
						game.timerInterval = null;
					}

					this.broadcast(gameId, {
						type: "gameEnded",
						gameState: game.gameState,
						users: Array.from(game.users.entries()).map(([id, data]) => ({
							id,
							...data,
						})),
					});
				}
			}

			if (this.games.size > 0) {
				await this.state.storage.put("games", Array.from(this.games.entries()));
			} else {
				await this.state.storage.deleteAll();
			}
		} catch (error) {
			console.error("Error handling alarm:", error);
			throw error;
		}
	}

	private getGamesList() {
		return Array.from(this.games.entries()).map(([gameId, game]) => ({
			id: gameId,
			name: game.name,
			playerCount: game.users.size,
			isLobby: game.gameState.isLobby,
			isActive: game.gameState.isActive,
		}));
	}
}
