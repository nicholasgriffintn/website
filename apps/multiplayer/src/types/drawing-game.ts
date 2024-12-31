import type {
	BaseGameState,
	BaseGameConfig,
	RuntimeGameData,
} from "./base-game";

export interface DrawingGameState extends BaseGameState {
	targetWord: string;
	guesses: Array<{
		playerId: string;
		playerName: string;
		guess: string;
		timestamp: number;
		correct: boolean;
	}>;
	hasWon: boolean;
	currentDrawer?: string;
	drawingData?: string;
}

export interface DrawingGameConfig extends BaseGameConfig {
	aiEnabled: boolean;
	aiGuessCooldown: number;
	correctGuesserScore: number;
	correctDrawerScore: number;
	aiNames: string[];
}

export interface DrawingRuntimeGameData extends RuntimeGameData {
	gameState: DrawingGameState;
	lastAIGuessTime: number;
}