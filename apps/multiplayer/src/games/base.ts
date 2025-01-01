import type { DurableObjectState } from "@cloudflare/workers-types";

import type { Env } from "../types/app";
import type {
	BaseGameState,
	BaseGameConfig,
	RuntimeGameData,
	StoredGameData,
} from "../types/base-game";

export abstract class BaseMultiplayerGame<
	TGameState extends BaseGameState = BaseGameState,
	TRuntimeData extends RuntimeGameData = RuntimeGameData,
	TGameStartParams = { gameId: string; playerId: string }
> {
	protected static readonly AI_PLAYER_ID = "ai-player";
	protected games: Map<string, TRuntimeData> = new Map();
	protected wsToPlayer: Map<WebSocket, string> = new Map();
	protected readonly config: BaseGameConfig & {
		aiEnabled?: boolean;
		aiNames?: string[];
	};

	constructor(
		protected readonly state: DurableObjectState,
		protected readonly env: Env,
		config: BaseGameConfig & {
			aiEnabled?: boolean;
			aiNames?: string[];
		},
	) {
		this.config = config;
		this.state.blockConcurrencyWhile(async () => {
			const storedGames = await this.state.storage.get<unknown>("games");
			if (storedGames) {
				const deserializedGames = this.deserializeGames(storedGames);
				for (const [id, game] of deserializedGames) {
					this.games.set(id, game);
				}
			}
		});
	}

	protected async initializeStorage() {
		try {
			await this.state.blockConcurrencyWhile(async () => {
				const storedGames = await this.state.storage.get("games");
				if (storedGames) {
					const runtimeGames = this.deserializeGames(storedGames);
					this.games = new Map(runtimeGames);
				} else {
					this.games = new Map();
				}
			});
		} catch (error) {
			console.error('Error initializing storage:', error);
			throw error;
		}
	}

	async fetch() {
		await this.initializeStorage();

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

			if (
				(data.action === "join" || data.action === "createGame") &&
				data.playerId
			) {
				this.wsToPlayer.set(ws, data.playerId);
			}

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
			const playerId = this.wsToPlayer.get(ws);
			if (playerId) {
				for (const [gameId, game] of this.games.entries()) {
					if (game.users.has(playerId)) {
						await this.handleLeave({ gameId, playerId });
					}
				}
				this.wsToPlayer.delete(ws);
			}

			if (
				code >= 1000 &&
				code <= 1015 &&
				code !== 1004 &&
				code !== 1005 &&
				code !== 1006
			) {
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
		try {
			const gameId = crypto.randomUUID();
			const gameState = this.initializeGameState(gameName, gameId);

			const newGame: RuntimeGameData = {
				id: gameId,
				name: gameName,
				users: new Map([[playerId, { name: playerName, score: 0 }]]),
				gameState,
				timerInterval: null,
			};

			// Cast to TRuntimeData after creating a valid RuntimeGameData
			const typedGame = newGame as unknown as TRuntimeData;
			this.games.set(gameId, typedGame);

			if (this.config.aiEnabled) {
				const randomAiName =
					this.config.aiNames?.[
						Math.floor(Math.random() * this.config.aiNames.length)
					];

				typedGame.users.set((this.constructor as typeof BaseMultiplayerGame).AI_PLAYER_ID, {
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
		} catch (error) {
			console.error('Error in handleCreateGame:', error);
			throw error;
		}
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
		try {
			const game = this.games.get(gameId);
			if (!game) {
				console.error('Game not found:', gameId);
				throw new Error("Game not found");
			}

			if (!game.users.has(playerId)) {
				game.users.set(playerId, { name: playerName, score: 0 });
				await this.saveGames();

				this.broadcast(gameId, {
					type: "playerJoined",
					playerId,
					playerName,
				});
			}
		} catch (error) {
			console.error('Error in handleJoin:', error);
			throw error;
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
		await this.handlePlayerLeave(gameId, playerId);
		await this.saveGames();

		this.broadcast(gameId, {
			type: "playerLeft",
			playerId,
		});

		await this.broadcastGameState(gameId);
	}

	protected startGameTimer(gameId: string) {
		const game = this.games.get(gameId);
		if (!game || !this.config.gameDuration) return;

		if (game.timerInterval) {
			clearInterval(game.timerInterval);
		}

		game.timerInterval = setInterval(() => {
			if (!game.gameState.isActive) {
				if (game.timerInterval) {
					clearInterval(game.timerInterval);
					game.timerInterval = null;
				}
				return;
			}

			const now = Date.now();
			if (game.gameState.endTime) {
				game.gameState.timeRemaining = Math.max(
					0,
					Math.ceil((game.gameState.endTime - now) / 1000),
				);

				this.broadcastGameState(gameId).catch(error => {
					console.error('Error broadcasting game state:', error);
				});

				if (game.gameState.timeRemaining <= 0) {
					if (game.timerInterval) {
						clearInterval(game.timerInterval);
						game.timerInterval = null;
					}
					this.handleGameTimeout(gameId).catch(error => {
						console.error('Error handling game timeout:', error);
					});
				}
			}
		}, 1000);
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
		try {
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
		} catch (error) {
			console.error('Error saving games:', error);
			throw error;
		}
	}

	protected broadcast(gameId: string, message: any) {
		const game = this.games.get(gameId);
		if (!game) return;

		if (message.type === "drawingUpdate") {
			const { drawingData } = message;

			for (const [ws, playerId] of this.wsToPlayer.entries()) {
				try {
					if (drawingData && playerId !== game.gameState.currentDrawer) {
						ws.send(
							JSON.stringify({
								type: "drawingUpdate",
								drawingData,
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

		let messageStr: string;
		if (typeof message === 'string') {
			messageStr = message;
		} else {
			messageStr = JSON.stringify({
				...message,
				gameId,
				gameName: game.name,
				users: Array.from(game.users.entries()).map(([id, data]) => ({
					id,
					...data,
				})),
			});
		}

		for (const ws of this.state.getWebSockets()) {
			try {
				ws.send(messageStr);
			} catch (error) {
				console.error("Error sending message to WebSocket:", error);
			}
		}
	}

	private getGamesList() {
		const gamesList = Array.from(this.games.entries()).map(([gameId, game]) => ({
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
		
		return gamesList;
	}

	protected abstract deserializeGames(
		storedGames: unknown,
	): [string, TRuntimeData][];
	protected abstract initializeGameState(
		gameName: string,
		creator: string,
	): TGameState;
	protected abstract handleGameAction(
		action: string,
		data: any,
		game: TRuntimeData | undefined,
	): Promise<void>;
	protected abstract handleGameStart(params: TGameStartParams): Promise<void>;
	protected abstract handleGameTimeout(gameId: string): Promise<void>;
	protected abstract handlePlayerLeave(
		gameId: string,
		playerId: string,
	): Promise<void>;
}
