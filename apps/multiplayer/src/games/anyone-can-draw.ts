import { BaseMultiplayerGame } from "./base";
import { GAME_WORDS } from "../constants";
import { onAIGuessDrawing } from "../utils/ai-utils";
import type { Env } from "../types/app";
import type {
	DrawingGameConfig,
	DrawingRuntimeGameData,
	DrawingGameState,
} from "../types/drawing-game";

export class DrawingGame extends BaseMultiplayerGame {
	public static readonly AI_PLAYER_ID = "ai-player";
	protected readonly config: DrawingGameConfig;

	constructor(state: DurableObjectState, env: Env, config: DrawingGameConfig) {
		super(state, env, {
			gameDuration: config.gameDuration,
			minPlayers: config.minPlayers,
			maxPlayers: config.maxPlayers,
		});
		this.config = config;
	}

	protected deserializeGames(
		storedGames: unknown,
	): [string, DrawingRuntimeGameData][] {
		return (storedGames as [string, DrawingRuntimeGameData][]).map(
			([id, game]) => [
				id,
				{
					...game,
					users: new Map(game.users),
					timerInterval: null,
					lastAIGuessTime: game.lastAIGuessTime || 0,
				},
			],
		);
	}

	protected initializeGameState(
		gameName: string,
		creator: string,
	): DrawingGameState {
		const gameState: DrawingGameState = {
			isActive: false,
			isLobby: true,
			targetWord: "",
			timeRemaining: this.config.gameDuration,
			guesses: [],
			hasWon: false,
			currentDrawer: undefined,
			drawingData: undefined,
		};

		if (this.config.aiEnabled) {
			const randomAiName =
				this.config.aiNames[
					Math.floor(Math.random() * this.config.aiNames.length)
				];

			const game = this.games.get(creator);
			if (game) {
				game.name = gameName;
				game.users.set(DrawingGame.AI_PLAYER_ID, {
					name: randomAiName,
					score: 0,
				});
			}
		}

		return gameState;
	}

	protected validateGameStart(game: DrawingRuntimeGameData): boolean {
		return game.users.size >= this.config.minPlayers;
	}

	public async handleGameStart({
		gameId,
		playerId,
	}: {
		gameId: string;
		playerId: string;
	}): Promise<void> {
		const game = this.games.get(gameId) as DrawingRuntimeGameData;
		if (!game) throw new Error("Game not found");

		if (game.gameState.isActive || !this.validateGameStart(game)) {
			return;
		}

		const randomWord =
			GAME_WORDS[Math.floor(Math.random() * GAME_WORDS.length)];

		game.gameState = {
			isActive: true,
			isLobby: false,
			targetWord: randomWord,
			timeRemaining: this.config.gameDuration,
			guesses: [],
			hasWon: false,
			currentDrawer: playerId,
			endTime: Date.now() + this.config.gameDuration * 1000,
			drawingData: undefined,
		};

		this.startGameTimer(gameId);

		if (game.gameState.endTime) {
			await this.state.storage.setAlarm(game.gameState.endTime);
		}

		await this.saveGames();

		this.broadcast(gameId, {
			type: "gameStarted",
			gameState: {
				...game.gameState,
				targetWord:
					game.gameState.currentDrawer === playerId
						? game.gameState.targetWord
						: "",
			},
		});
	}

	protected async handleGameAction(
		action: string,
		data: any,
		game: DrawingRuntimeGameData | undefined,
	): Promise<void> {
		if (!game) return;

		switch (action) {
			case "submitGuess":
				await this.handleGuess(data);
				break;
			case "updateDrawing":
				await this.handleDrawingUpdate(data);
				break;
		}
	}

	protected async handlePlayerLeave(
		gameId: string,
		playerId: string,
	): Promise<void> {
		const game = this.games.get(gameId) as DrawingRuntimeGameData;
		if (!game) return;

		if (game.gameState.currentDrawer === playerId) {
			game.gameState.isActive = false;
			game.gameState.isLobby = true;
			game.gameState.currentDrawer = undefined;
			game.gameState.statusMessage = {
				type: "failure",
				message: "Game ended - drawer left the game"
			};
			await this.saveGames();
		}
	}

	private async handleGuess({
		gameId,
		playerId,
		guess,
	}: {
		gameId: string;
		playerId: string;
		guess: string;
	}) {
		const game = this.games.get(gameId) as DrawingRuntimeGameData;
		if (!game || !game.gameState.isActive) return;

		if (playerId === game.gameState.currentDrawer) return;

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
			await this.handleCorrectGuess(game, playerId);
		}

		await this.saveGames();
	}

	private async handleCorrectGuess(
		game: DrawingRuntimeGameData,
		playerId: string,
	) {
		const timeBasedMultiplier =
			game.gameState.timeRemaining / this.config.gameDuration;

		const guesser = game.users.get(playerId);
		if (guesser) {
			guesser.score =
				Math.round(
					(guesser.score +
						this.config.correctGuesserScore * timeBasedMultiplier) *
						10,
				) / 10;
		}

		const nonDrawerPlayers = Array.from(game.users.entries()).filter(
			([id]) =>
				id !== game.gameState.currentDrawer && id !== DrawingGame.AI_PLAYER_ID,
		);

		const drawer = game.gameState.currentDrawer
			? game.users.get(game.gameState.currentDrawer)
			: undefined;

		if (drawer) {
			drawer.score =
				Math.round(
					(drawer.score +
						(this.config.correctDrawerScore * timeBasedMultiplier) /
							nonDrawerPlayers.length) *
						10,
				) / 10;
		}

		const correctGuesses = new Set(
			game.gameState.guesses.filter((g) => g.correct).map((g) => g.playerId),
		);

		const allPlayersGuessedCorrectly = nonDrawerPlayers.every(([playerId]) =>
			correctGuesses.has(playerId),
		);

		if (allPlayersGuessedCorrectly) {
			await this.handleRoundEnd(game, true);
		} else {
			game.gameState.statusMessage = {
				type: "success",
				message: `${game.users.get(playerId)?.name || "Unknown Player"} guessed correctly!`,
			};
		}
	}

	private async handleDrawingUpdate({
		gameId,
		drawingData,
	}: {
		gameId: string;
		drawingData: any;
	}) {
		const game = this.games.get(gameId) as DrawingRuntimeGameData;
		if (!game || !game.gameState.isActive) return;

		if (
			this.config.aiEnabled &&
			(!game.lastAIGuessTime ||
				Date.now() - game.lastAIGuessTime >= this.config.aiGuessCooldown)
		) {
			await this.processAIGuess(game, drawingData);
		}

		this.broadcast(gameId, {
			type: "drawingUpdate",
			drawingData,
		});
	}

	private async processAIGuess(
		game: DrawingRuntimeGameData,
		drawingData: string,
	) {
		try {
			const aiHasGuessedCorrectly = game.gameState.guesses.some(
				(guess) => guess.playerId === DrawingGame.AI_PLAYER_ID && guess.correct,
			);

			if (!aiHasGuessedCorrectly) {
				const aiGuess = await onAIGuessDrawing(drawingData, this.env);

				if (aiGuess.guess) {
					game.lastAIGuessTime = Date.now();

					const gameId = Array.from(this.games.entries()).find(
						([_, g]) => g === game,
					)?.[0];

					if (gameId) {
						await this.handleGuess({
							gameId,
							playerId: DrawingGame.AI_PLAYER_ID,
							guess: aiGuess.guess,
						});
					}
				}
			}
		} catch (error) {
			console.error("Error processing AI guess:", error);
		}
	}

	protected async handleGameTimeout(gameId: string): Promise<void> {
		const game = this.games.get(gameId) as DrawingRuntimeGameData;
		if (!game) return;

		await this.handleRoundEnd(game, false);
	}

	private async handleRoundEnd(game: DrawingRuntimeGameData, success: boolean) {
		const oldWord = game.gameState.targetWord;

		game.gameState = {
			...game.gameState,
			isActive: false,
			isLobby: true,
			targetWord: "",
			timeRemaining: this.config.gameDuration,
			currentDrawer: undefined,
			endTime: undefined,
			hasWon: success,
			statusMessage: {
				type: success ? "success" : "failure",
				message: success
					? `Everyone guessed correctly! The word was "${oldWord}"`
					: `Time's up! The word was "${oldWord}"`,
			},
		};

		if (game.timerInterval) {
			clearInterval(game.timerInterval);
			game.timerInterval = null;
		}

		await this.saveGames();
	}
}