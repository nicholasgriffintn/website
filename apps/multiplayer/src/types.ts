import type { Ai } from "@cloudflare/workers-types";

export type Env = {
	AI: Ai;
};

export interface Player {
	id: string;
	name: string;
	score: number;
}

export interface GameMessage {
	type: "CHAT" | "GUESS" | "SYSTEM";
	playerId: string;
	playerName: string;
	content: string;
	timestamp: number;
}

export interface GameState {
	isActive: boolean;
	targetWord: string;
	timeRemaining: number;
	endTime?: number;
	guesses: Array<{
		guess: string;
		timestamp: number;
		playerId: string;
		playerName: string;
		correct: boolean;
	}>;
	hasWon: boolean;
	currentDrawer?: string;
	drawingData?: string;
	statusMessage?: {
		type: "success" | "failure";
		message: string;
	};
	isLobby: boolean;
}

export interface JoinRequest {
	gameId: string;
	playerId: string;
	playerName: string;
}

export interface LeaveRequest {
	playerId: string;
}

export interface StartGameRequest {
	gameId: string;
	playerId: string;
}

export interface GuessRequest {
	gameId: string;
	playerId: string;
	guess: string;
}

export interface DrawingUpdateRequest {
	gameId: string;
	drawingData: string;
}

export interface BaseResponse {
	ok: boolean;
	success: boolean;
	message?: string;
	statusCode?: number;
}

export interface GameStateResponse extends BaseResponse {
	gameState: GameState;
	users: Array<{
		id: string;
		name: string;
		score: number;
	}>;
}

export interface Game {
	name: string;
	users: Map<string, { name: string; score: number }>;
	gameState: GameState;
	timerInterval: number | null;
	lastAIGuessTime: number;
}

export interface GameListItem {
	id: string;
	name: string;
	playerCount: number;
	isLobby: boolean;
	isActive: boolean;
}

export interface StoredGameData {
	name: string;
	users: [string, { name: string; score: number }][];
	gameState: GameState;
	timerInterval: null;
	lastAIGuessTime: number;
}

export interface RuntimeGameData {
	name: string;
	users: Map<string, { name: string; score: number }>;
	gameState: GameState;
	timerInterval: number | null;
	lastAIGuessTime: number;
}
