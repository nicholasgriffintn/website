export interface User {
  id: string;
  name: string;
  score: number;
}

export interface GameListItem {
  id: string;
  name: string;
  playerCount: number;
}

export interface StatusMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
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
}

export interface NarrativeGameState {
  gameId?: string;
  isActive: boolean;
  isLobby: boolean;
  theme: string;
  timeRemaining: number;
  contributions: StoryContribution[];
  currentTurn?: string;
  storyPrompt: string;
  hasEnded: boolean;
  score: number;
  aiSuggestions: AIIntervention[];
  lastContribution: StoryContribution | null;
  themeVotes: ThemeVote[];
  selectedThemes: string[];
  isVotingPhase: boolean;
  isReviewPhase: boolean;
  contributionReviews: ContributionReview[];
  alternativeEndings: AlternativeEnding[];
  aiCooldownEnd?: number;
  statusMessage?: StatusMessage;
  notification?: StatusMessage;
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