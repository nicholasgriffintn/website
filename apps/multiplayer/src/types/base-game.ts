export interface BaseGameState {
    isActive: boolean;
    isLobby: boolean;
    timeRemaining: number;
    endTime?: number;
    statusMessage?: {
        type: 'success' | 'failure';
        message: string;
    };
}

export interface BaseUserData {
    name: string;
    score: number;
}

export interface BaseGameConfig {
    gameDuration: number;
    minPlayers: number;
    maxPlayers?: number;
}

export interface RuntimeGameData {
    name: string;
    users: Map<string, BaseUserData>;
    gameState: BaseGameState;
    timerInterval: number | null;
}

export interface StoredGameData {
    name: string;
    users: [string, BaseUserData][];
    gameState: BaseGameState;
    timerInterval: null;
}