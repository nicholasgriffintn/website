import type { BaseGameState, RuntimeGameData } from "./base-game";

export interface NarrativeGameConfig {
	minPlayers: number;
	maxPlayers: number;
	aiInterventionFrequency: number;
	aiEnabled: boolean;
	aiInterventionCooldown: number;
	roundsPerPlayer: number;
}

export interface StoryContribution {
	playerId: string;
	text: string;
	timestamp: number;
	votes: number;
}

export interface AIIntervention {
	type: 'twist' | 'resolution' | 'enhancement';
	suggestion: string;
	votes: number;
	voters: string[];
}

export interface StatusMessage {
	type: 'success' | 'error' | 'info' | 'warning' | 'failure';
	message: string;
}

export interface ThemeVote {
	playerId: string;
	theme: string;
	timestamp: number;
}

export interface ContributionReview {
	contributionId: number;
	votes: number;
	voters: string[];
}

export interface AlternativeEnding {
	playerId: string;
	text: string;
	votes: number;
	voters: string[];
}

export interface NarrativeGameState extends BaseGameState {
	theme: string;
	contributions: StoryContribution[];
	currentTurn?: string;
	storyPrompt: string;
	hasEnded: boolean;
	score: number;
	aiSuggestions: AIIntervention[];
	lastContribution: StoryContribution | null;
	statusMessage?: StatusMessage;
	notification?: StatusMessage;
	themeVotes: ThemeVote[];
	selectedThemes: string[];
	isVotingPhase: boolean;
	isReviewPhase: boolean;
	contributionReviews: ContributionReview[];
	alternativeEndings: AlternativeEnding[];
	aiCooldownEnd?: number;
	currentRound: number;
	totalRounds: number;
}

export interface NarrativeRuntimeGameData extends RuntimeGameData {
	gameState: NarrativeGameState;
	lastAIInterventionTime: number;
	reviewPhaseTimeout: ReturnType<typeof setTimeout> | null;
}
