import type { DurableObjectState } from "@cloudflare/workers-types";

import type { Env } from "../types/app";
import type {
	BaseGameState,
	BaseGameConfig,
	RuntimeGameData,
	StoredGameData,
} from "../types/base-game";

export abstract class BaseMultiplayerGame {
	protected static readonly AI_PLAYER_ID = "ai-player";
	protected readonly config: BaseGameConfig & {
		aiEnabled?: boolean;
		aiNames?: string[];
	};
	protected state: DurableObjectState;
	protected env: Env;
	protected games: Map<string, RuntimeGameData>;

	constructor(state: DurableObjectState, env: Env, config: BaseGameConfig) {
		this.state = state;
		this.env = env;
		this.games = new Map();
		this.config = config;

		this.initializeStorage();
	}

	protected async initializeStorage() {
		await this.state.blockConcurrencyWhile(async () => {
			const storedGames = await this.state.storage.get("games");
			if (storedGames) {
				const runtimeGames = this.deserializeGames(storedGames);
				this.games = new Map(runtimeGames);
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
					await this.handleGameStart(data);
					break;
				default:
					await this.handleGameAction(
						data.action,
						data,
						this.games.get(data.gameId),
					);
			}

			if (data.gameId) {
				await this.broadcastGameState(data.gameId);
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

	protected async handleCreateGame({
		gameName,
		playerId,
		playerName,
	}: {
		gameName: string;
		playerId: string;
		playerName: string;
	}) {
		const gameId = crypto.randomUUID();
		const gameState = this.initializeGameState(gameName, gameId);

		const newGame: RuntimeGameData = {
			name: gameName,
			users: new Map([[playerId, { name: playerName, score: 0 }]]),
			gameState,
			timerInterval: null,
		};

		this.games.set(gameId, newGame);

		if (this.config.aiEnabled) {
			const randomAiName =
				this.config.aiNames?.[
					Math.floor(Math.random() * this.config.aiNames.length)
				];

			newGame.users.set(BaseMultiplayerGame.AI_PLAYER_ID, {
				name: randomAiName || "AI Player",
				score: 0,
			});
		}

		await this.saveGames();

		this.broadcast(gameId, {
			type: "gameCreated",
			gameId,
			gameName,
			gameState,
		});

		return gameId;
	}

	protected async handleJoin({
		gameId,
		playerId,
		playerName,
	}: {
		gameId: string;
		playerId: string;
		playerName: string;
	}) {
		const game = this.games.get(gameId);
		if (!game) throw new Error("Game not found");

		if (!game.users.has(playerId)) {
			game.users.set(playerId, { name: playerName, score: 0 });
			await this.saveGames();

			this.broadcast(gameId, {
				type: "playerJoined",
				playerId,
				playerName,
			});
		}
	}

	protected async handleLeave({
		gameId,
		playerId,
	}: {
		gameId: string;
		playerId: string;
	}) {
		const game = this.games.get(gameId);
		if (!game) return;

		game.users.delete(playerId);
		await this.saveGames();

		this.broadcast(gameId, {
			type: "playerLeft",
			playerId,
		});

		await this.handlePlayerLeave(gameId, playerId);
	}

	protected startGameTimer(gameId: string) {
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

				await this.broadcastGameState(gameId);

				if (game.gameState.timeRemaining <= 0) {
					await this.handleGameTimeout(gameId);
				}
			}
		}, 1000) as unknown as number;
	}

	async alarm() {
		for (const [gameId, game] of this.games) {
			if (
				game.gameState.isActive &&
				game.gameState.endTime &&
				Date.now() >= game.gameState.endTime
			) {
				await this.handleGameTimeout(gameId);
			}
		}

		if (this.games.size > 0) {
			await this.saveGames();
		} else {
			await this.state.storage.deleteAll();
		}
	}

	protected async broadcastGameState(gameId: string) {
		const game = this.games.get(gameId);
		if (!game) return;

		this.broadcast(gameId, {
			type: "gameState",
			gameState: game.gameState,
			users: Array.from(game.users.entries()).map(([id, data]) => ({
				id,
				...data,
			})),
		});
	}

	protected async saveGames() {
		const storedGames: [string, StoredGameData][] = Array.from(
			this.games.entries(),
		).map(([id, game]) => [
			id,
			{
				...game,
				users: Array.from(game.users.entries()),
				timerInterval: null,
			},
		]);
		await this.state.storage.put("games", storedGames);
	}

	protected broadcast(gameId: string, message: any) {
		const game = this.games.get(gameId);
		if (!game) return;

		if (message.type === "drawingUpdate") {
			const { drawingData, ...messageWithoutDrawing } = message;

			for (const ws of this.state.getWebSockets()) {
				try {
					if (drawingData) {
						ws.send(
							JSON.stringify({
								type: "drawingUpdate",
								drawingData: drawingData,
								gameId,
							}),
						);
					}
				} catch (error) {
					console.error("Error sending message to WebSocket:", error);
				}
			}
			return;
		}

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

	private getGamesList() {
		return Array.from(this.games.entries()).map(([gameId, game]) => ({
			id: gameId,
			name: game.name,
			playerCount: game.users.size,
			players: Array.from(game.users.entries()).map(([id, data]) => ({
				id,
				name: data.name,
			})),
			isLobby: game.gameState.isLobby,
			isActive: game.gameState.isActive,
		}));
	}

	protected abstract deserializeGames(
		storedGames: unknown,
	): [string, RuntimeGameData][];
	protected abstract initializeGameState(
		gameName: string,
		creator: string,
	): BaseGameState;
	protected abstract handleGameAction(
		action: string,
		data: any,
		game: RuntimeGameData | undefined,
	): Promise<void>;
	protected abstract handleGameStart({
		gameId,
		playerId,
	}: {
		gameId: string;
		playerId: string;
	}): Promise<void>;
	protected abstract handleGameTimeout(gameId: string): Promise<void>;
	protected abstract handlePlayerLeave(
		gameId: string,
		playerId: string,
	): Promise<void>;
}