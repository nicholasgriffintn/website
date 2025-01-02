import type { AiModels } from "@cloudflare/workers-types";

import { BaseMultiplayerGame } from "./base";
import type { Env } from "../types/app";
import type { StoredGameData } from "../types/base-game";
import type {
	NarrativeGameConfig,
	NarrativeRuntimeGameData,
	NarrativeGameState,
	StoryContribution,
	AIIntervention,
} from "../types/narrative-game";

/**
 * A game where players collaborate to create a story.
 * Players first vote on a theme which the AI will use the generate a overall theme and then an initial story prompt.
 * Players then take turns contributing to the story.
 * The story is then reviewed by the AI and the players vote on the best ideas to continue the story.
 * The story is then reviewed by the AI again and the players vote on the best ideas to end the story.
 */
export class NarrativeGame extends BaseMultiplayerGame<
	NarrativeGameState,
	NarrativeRuntimeGameData,
	{ gameId: string; theme: string }
> {
	protected readonly config: NarrativeGameConfig;

	constructor(
		state: DurableObjectState,
		env: Env,
		config: NarrativeGameConfig,
	) {
		super(state, env, {
			minPlayers: config.minPlayers,
			maxPlayers: config.maxPlayers,
			roundsPerPlayer: config.roundsPerPlayer,
		});
		this.config = config;
	}

	/**
	 * This is used to convert the stored game data to the runtime game data.
	 */
	protected deserializeGames(
		storedGames: unknown,
	): [string, NarrativeRuntimeGameData][] {
		return (
			storedGames as [
				string,
				StoredGameData & { lastAIInterventionTime?: number; gameState: NarrativeGameState },
			][]
		).map(([id, game]) => {
			const gameState: NarrativeGameState = {
				isActive: game.gameState.isActive,
				isLobby: game.gameState.isLobby,
				theme: game.gameState.theme || "",
				contributions: game.gameState.contributions || [],
				currentTurn: game.gameState.currentTurn,
				storyPrompt: game.gameState.storyPrompt || "",
				hasEnded: game.gameState.hasEnded || false,
				score: game.gameState.score || 0,
				aiSuggestions: game.gameState.aiSuggestions || [],
				lastContribution: game.gameState.lastContribution || null,
				themeVotes: game.gameState.themeVotes || [],
				selectedThemes: game.gameState.selectedThemes || [],
				isVotingPhase: game.gameState.isVotingPhase || false,
				isReviewPhase: game.gameState.isReviewPhase || false,
				contributionReviews: game.gameState.contributionReviews || [],
				alternativeEndings: game.gameState.alternativeEndings || [],
				currentRound: game.gameState.currentRound || 0,
				totalRounds: game.gameState.totalRounds || 0,
				timeRemaining: game.gameState.timeRemaining || 0,
				statusMessage: game.gameState.statusMessage,
			};

			return [
				id,
				{
					id,
					name: game.name,
					users: new Map(game.users),
					gameState,
					timerInterval: null,
					lastAIInterventionTime: game.lastAIInterventionTime || Date.now(),
					reviewPhaseTimeout: null,
				},
			];
		});
	}

	/**
	 * This is used to initialize the game state.
	 */
	protected initializeGameState(
		gameName: string,
		creator: string,
	): NarrativeGameState {
		return {
			isActive: false,
			isLobby: true,
			theme: "",
			contributions: [],
			currentTurn: creator,
			storyPrompt: "",
			hasEnded: false,
			score: 0,
			aiSuggestions: [],
			lastContribution: null,
			themeVotes: [],
			selectedThemes: [],
			isVotingPhase: false,
			isReviewPhase: false,
			contributionReviews: [],
			alternativeEndings: [],
			currentRound: 0,
			totalRounds: 0,
			timeRemaining: 0,
			statusMessage: {
				type: "info",
				message: "Game created! Waiting for players...",
			},
		};
	}

	/**
	 * This is used to validate the game is ready to start.
	 */
	protected validateGameStart(game: NarrativeRuntimeGameData): boolean {
		if (!game.gameState.isActive) {
			return game.users.size >= this.config.minPlayers;
		}
		return true;
	}

	/**
	 * Safe state update with rollback capability
	 */
	private async safeStateUpdate(
		gameId: string,
		updateFn?: (game: NarrativeRuntimeGameData) => Promise<any>,
	): Promise<void> {
		const game = this.games.get(gameId);
		if (!game?.gameState) {
			console.log("Game not found");
			return;
		}

		const prevState = structuredClone(game.gameState);

		try {
			if (updateFn) {
				await updateFn(game);
			}
			await this.saveGames();
			await this.broadcastGameState(gameId);
		} catch (error) {
			console.error("Error updating game state:", error);
			game.gameState = prevState;
			console.log("Game state restored due to error");
		}
	}

	/**
	 * This is used to start the game. It checks all of the conditions are met.
	 * If they are, it generates the story prompt and starts the game.
	 */
	public async handleGameStart({
		gameId,
		theme,
	}: {
		gameId: string;
		theme: string;
	}): Promise<void> {
		const game = this.games.get(gameId);
		if (!game) {
			console.error("Game not found");
			return;
		}

		if (game.gameState.isActive) {
			console.log("Game is already active");
			return;
		}

		if (!game.gameState.selectedThemes.includes(theme)) {
			console.log("Invalid theme selected");
			return;
		}

		if (!this.validateGameStart(game)) {
			console.log(`Need at least ${this.config.minPlayers} players to start`);
			return;
		}

		try {
			game.gameState.statusMessage = {
				type: "info",
				message: "Generating story prompt...",
			};
			await this.broadcastGameState(gameId);

			const storyPrompt = await this.generateStoryPrompt(theme);

			const totalRounds = game.users.size * this.config.roundsPerPlayer;

			game.gameState = {
				...game.gameState,
				isActive: true,
				isLobby: false,
				theme,
				contributions: [],
				currentTurn: Array.from(game.users.keys())[0],
				storyPrompt,
				hasEnded: false,
				score: 0,
				aiSuggestions: [],
				lastContribution: null,
				currentRound: 1,
				totalRounds,
				timeRemaining: 0,
				statusMessage: {
					type: "success",
					message: "Game started! Make your first contribution.",
				},
			};

			await this.safeStateUpdate(gameId);
		} catch (error) {
			console.error("Error starting game:", error);
		}
	}

	/**
	 * This is used to generate the story prompt, using AI.
	 */
	private async generateStoryPrompt(theme: string): Promise<string> {
		try {
			if (theme === "") {
				return "Once upon a time...";
			}

			const response = await this.env.AI.run(
				"@cf/meta/llama-3.1-8b-instruct-fast" as keyof AiModels,
				{
					messages: [
						{
							role: "system",
							content:
								"You are generating story prompts. Respond with only the prompt sentence. No explanations or additional text.",
						},
						{
							role: "user",
							content: `Write a single opening sentence for a ${theme} story. Make it open-ended and under 30 words.`,
						},
					],
				},
			);

			// @ts-expect-error - Cloudflare is wrong
			return response.response || "Once upon a time...";
		} catch (error) {
			console.error("Error generating story prompt:", error);
			return "Once upon a time...";
		}
	}

	/**
	 * This receives actions from the client and handles them.
	 */
	protected async handleGameAction(
		action: string,
		data: any,
		game: NarrativeRuntimeGameData | undefined,
	): Promise<void> {
		console.log("Received game action:", { action, data, gameExists: !!game });
		
		if (!game) {
			console.error("Game not found for action:", { action, gameId: data?.gameId });
			return;
		}

		switch (action) {
			case "addContribution":
				console.log("Handling contribution:", data);
				await this.handleContribution(data);
				break;
			case "voteOnSuggestion":
				await this.handleVote(data);
				break;
			case "requestAIIntervention":
				await this.handleAIIntervention(data);
				break;
			case "themeVote":
				await this.handleThemeVote(data);
				break;
			case "contributionVote":
				await this.handleContributionVote(data);
				break;
			case "alternativeEnding":
				await this.handleAlternativeEnding(data);
				break;
			case "endGame":
				await this.handleEndGame(data);
				break;
		}
	}

	/**
	 * This handles the contribution of a player, ensuring it is their turn.
	 * It also triggers the AI intervention to suggest twists and resolutions.
	 */
	private async handleContribution({
		gameId,
		playerId,
		contribution,
	}: {
		gameId: string;
		playerId: string;
		contribution: string;
	}) {
		console.log("Starting contribution handler:", { gameId, playerId });
		
		await this.safeStateUpdate(gameId, async (game) => {
			console.log("Game state check:", { 
				isActive: game.gameState.isActive,
				currentTurn: game.gameState.currentTurn,
				playerMatch: playerId === game.gameState.currentTurn
			});

			if (!game.gameState.isActive) {
				console.error("Game is not active");
				return;
			}

			if (playerId !== game.gameState.currentTurn) {
				console.error("It's not your turn", {
					expected: game.gameState.currentTurn,
					received: playerId
				});
				return;
			}

			console.log("Adding contribution", contribution);

			const newContribution: StoryContribution = {
				playerId,
				text: contribution,
				timestamp: Date.now(),
				votes: 0,
			};

			game.gameState.contributions.push(newContribution);
			game.gameState.lastContribution = newContribution;

			const user = game.users.get(playerId);
			if (user) {
				user.score += 5;
			}

			const humanPlayers = Array.from(game.users.keys()).filter(
				(id) => id !== NarrativeGame.AI_PLAYER_ID,
			);
			const currentIndex = humanPlayers.indexOf(playerId);
			const nextIndex = (currentIndex + 1) % humanPlayers.length;
			game.gameState.currentTurn = humanPlayers[nextIndex];

			if (nextIndex === 0) {
				game.gameState.currentRound++;
				if (game.gameState.currentRound > game.gameState.totalRounds) {
					await this.handleGameEnd(game);
					return;
				}
				game.gameState.statusMessage = {
					type: "info" as const,
					message: `Round ${game.gameState.currentRound} of ${game.gameState.totalRounds}`,
				};
				return;
			}

			const nextPlayer = game.users.get(game.gameState.currentTurn);
			game.gameState.notification = {
				type: "success" as const,
				message: `Contribution added successfully! It's ${nextPlayer?.name}'s turn now!`,
			};
		});
	}

	/**
	 * This triggers the AI intervention to suggest changes to the story.
	 */
	private async triggerAIIntervention(game: NarrativeRuntimeGameData) {
		const suggestions = await this.generateAISuggestions(game);
		game.gameState.aiSuggestions = suggestions;
	}

	/**
	 * This generates the AI suggestions for interventions
	 */
	private async generateAISuggestions(
		game: NarrativeRuntimeGameData,
	): Promise<AIIntervention[]> {
		try {
			const now = Date.now();
			if (
				now - game.lastAIInterventionTime <
				this.config.aiInterventionCooldown
			) {
				return [];
			}

			if (game.gameState.contributions.length === 0) {
				return [];
			}

			const story = game.gameState.contributions.map((c) => c.text).join(" ");

			if (story === "") {
				return [];
			}

			const response = await this.env.AI.run(
				"@cf/meta/llama-3.1-8b-instruct-fast" as keyof AiModels,
				{
					messages: [
						{
							role: "system",
							content:
								"You are a story enhancer. You must respond with EXACTLY three numbered suggestions, one per line. No introduction, no explanation, no additional text. Just three numbered lines starting with 1., 2., and 3.",
						},
						{
							role: "user",
							content: `Story so far:
"${story}"

Respond with exactly three lines in this format:
1. [dramatic twist]
2. [resolution]
3. [enhancement]

Each line must start with the number and period, followed by a single space. Each suggestion must be 1-2 sentences.`,
						},
					],
				},
			);

			// @ts-expect-error - Cloudflare is wrong
			if (!response || typeof response.response !== "string") {
				throw new Error("Invalid AI response format");
			}

			// @ts-expect-error - Cloudflare is wrong
			const suggestions = response.response
				.split("\n")
				.filter(Boolean)
				.map((suggestion: string, index: number) => ({
					type:
						index === 0 ? "twist" : index === 1 ? "resolution" : "enhancement",
					suggestion: suggestion.replace(/^\d\.\s*/, ""),
					votes: 0,
					voters: [] as string[],
				}));

			game.lastAIInterventionTime = now;
			return suggestions;
		} catch (error) {
			console.error("Error generating AI suggestions:", error);
			return [];
		}
	}

	protected async handleGameTimeout(gameId: string): Promise<void> {
		return;
	}

	/**
	 * Handles the end of the game, players are given two minutes to:
	 * 1. Vote on the best contributions
	 * 2. Suggest alternative endings
	 * 3. Review the story
	 * After that time, the scores are calculated and the game is ended.
	 */
	private async handleGameEnd(game: NarrativeRuntimeGameData) {
		if (game.gameState.hasEnded) return;
		game.gameState.hasEnded = true;
		game.gameState.isActive = false;

		game.gameState.contributionReviews = game.gameState.contributions.map((_, index) => ({
			contributionId: index,
			votes: 0,
			voters: [],
		}));

		const reviewTimeout = setTimeout(async () => {
			await this.finalizeReviewPhase(game);
		}, 120000);

		game.reviewPhaseTimeout = reviewTimeout;
		game.gameState.isReviewPhase = true;
		game.gameState.statusMessage = {
			type: "info",
			message: "All rounds completed! Review phase starting... You have 2 minutes to vote on the best contributions and suggest alternative endings.",
		};

		await this.safeStateUpdate(game.id);
	}

	private async handleVote({
		gameId,
		playerId,
		suggestionIndex,
	}: {
		gameId: string;
		playerId: string;
		suggestionIndex: number;
	}) {
		const game = this.games.get(gameId) as NarrativeRuntimeGameData;
		if (!game || !game.gameState.isActive) {
			console.log("Game is not active");
			return;
		}

		console.log("Current AI suggestions:", JSON.stringify(game.gameState.aiSuggestions, null, 2));
		console.log("Voting on suggestion", suggestionIndex);

		try {
			if (suggestionIndex >= game.gameState.aiSuggestions.length) {
				console.log("Invalid suggestion selected");
				return;
			}

			const suggestion = game.gameState.aiSuggestions[suggestionIndex];
			console.log("Found suggestion:", JSON.stringify(suggestion, null, 2));

			if (!suggestion.voters) {
				console.log("No voters array found, initializing");
				suggestion.voters = [];
			}

			if (suggestion.voters.includes(playerId)) {
				console.log("You have already voted for this suggestion");
				return;
			}

			suggestion.votes++;
			suggestion.voters.push(playerId);
			console.log("Updated suggestion:", JSON.stringify(suggestion, null, 2));

			const user = game.users.get(playerId);
			if (user) {
				user.score += 2;
			}

			if (suggestion.votes >= Math.ceil(game.users.size / 2)) {
				await this.applyAISuggestion(game, suggestionIndex);

				for (const voterId of suggestion.voters) {
					const voter = game.users.get(voterId);
					if (voter) {
						voter.score += 3;
					}
				}

				game.gameState.notification = {
					type: "success",
					message: "AI suggestion applied to the story! (+5 points for voters)",
				};
			} else {
				game.gameState.notification = {
					type: "info",
					message: "Vote recorded (+2 points)",
				};
			}

			await this.safeStateUpdate(gameId);
		} catch (error) {
			console.error("Error handling vote:", error);
			console.log("Failed to process vote. Please try again.");
		}
	}

	/**
	 * Players can manually trigger the AI intervention if the cooldown has passed.
	 */
	private async handleAIIntervention({
		gameId,
	}: {
		gameId: string;
	}) {
		const game = this.games.get(gameId) as NarrativeRuntimeGameData;
		if (!game || !game.gameState.isActive) {
			console.log("Game is not active");
			return;
		}

		try {
			const now = Date.now();
			if (
				now - game.lastAIInterventionTime <
				this.config.aiInterventionCooldown
			) {
				const remainingTime = Math.ceil(
					(this.config.aiInterventionCooldown -
						(now - game.lastAIInterventionTime)) /
						1000,
				);
				if (game) {
					game.gameState.aiCooldownEnd = now + remainingTime * 1000;
					await this.broadcastGameState(gameId);
				}
				return;
			}

			if (game) {
				game.gameState.notification = {
					type: "info",
					message: "AI is analyzing the story...",
				};
				await this.broadcastGameState(gameId);
			}

			await this.triggerAIIntervention(game);
			game.lastAIInterventionTime = now;

			if (game) {
				game.gameState.notification = {
					type: "success",
					message: "AI has provided new suggestions!",
				};
			}

			await this.safeStateUpdate(gameId);
		} catch (error) {
			console.error("Error handling AI intervention:", error);
		}
	}

	/**
	 * This applies the AI suggestion to the story if it has been voted on by enough players.
	 */
	private async applyAISuggestion(
		game: NarrativeRuntimeGameData,
		suggestionIndex: number,
	) {
		const suggestion = game.gameState.aiSuggestions[suggestionIndex];

		game.gameState.contributions.push({
			playerId: "ai",
			text: suggestion.suggestion,
			timestamp: Date.now(),
			votes: 0,
		});

		game.gameState.aiSuggestions = [];
	}

	/**
	 * Handles the player leaving the game.
	 */
	protected async handlePlayerLeave(
		gameId: string,
		playerId: string,
	): Promise<void> {
		const game = this.games.get(gameId) as NarrativeRuntimeGameData;
		if (!game || !game.users.has(playerId)) return;

		try {
			if (game.gameState.isLobby && game.gameState.themeVotes.length > 0) {
				game.gameState.themeVotes = game.gameState.themeVotes.filter(
					(vote) => vote.playerId !== playerId,
				);

				if (game.gameState.themeVotes.length === game.users.size - 1) {
					await this.blendThemes(game);
				}
			}

			if (game.gameState.currentTurn === playerId) {
				const remainingPlayers = Array.from(game.users.keys()).filter(
					(id) => id !== playerId,
				);
				if (remainingPlayers.length > 0) {
					game.gameState.currentTurn =
						remainingPlayers[
							Math.floor(Math.random() * remainingPlayers.length)
						];
				}
			}

			game.users.delete(playerId);

			await this.safeStateUpdate(gameId);
		} catch (error) {
			console.error("Error handling player leave:", error);
		}
	}

	/**
	 * Handles the player voting on the theme and triggers blending if enough players have voted.
	 */
	private async handleThemeVote({
		gameId,
		playerId,
		theme,
	}: {
		gameId: string;
		playerId: string;
		theme: string;
	}) {
		await this.safeStateUpdate(gameId, async (game) => {
			if (!game.gameState.isLobby) {
				console.log("Cannot vote for theme at this time");
				return;
			}

			game.gameState.themeVotes = game.gameState.themeVotes.filter(
				(vote) => vote.playerId !== playerId,
			);

			game.gameState.themeVotes.push({
				playerId,
				theme,
				timestamp: Date.now(),
			});

			if (game.gameState.themeVotes.length === game.users.size) {
				await this.blendThemes(game);
			}
		});
	}

	/**
	 * This blends the themes into a single theme that can be used to generate the story.
	 */
	private async blendThemes(game: NarrativeRuntimeGameData) {
		try {
			const themes = game.gameState.themeVotes.map((v) => v.theme);

			if (themes.length === 0) {
				game.gameState.selectedThemes = ["AI Adventure"];
				return;
			}

			const response = await this.env.AI.run(
				"@cf/meta/llama-3.1-8b-instruct-fast" as keyof AiModels,
				{
					messages: [
						{
							role: "system",
							content:
								"You are combining story themes. Return exactly three blended themes, one per line. No additional text or explanations.",
						},
						{
							role: "user",
							content: `Combine these themes: ${themes.join(", ")}

Return exactly 3 blended themes:
- Each must be 3-5 words
- Each must combine at least 2 themes
- One theme per line
- No explanations or additional text`,
						},
					],
				},
			);

			// @ts-expect-error - Cloudflare is wrong
			if (response.response) {
				// @ts-expect-error - Cloudflare is wrong
				game.gameState.selectedThemes = response.response
					.split("\n")
					.filter(Boolean)
					.map((theme: string) => theme.trim())
					.filter((theme: string) => theme.length > 0 && theme.length <= 50);
			}

			if (game.gameState.selectedThemes.length === 0) {
				game.gameState.selectedThemes = [game.gameState.themeVotes[0].theme];
			}

			game.gameState.statusMessage = {
				type: "success",
				message: "Themes have been blended! Choose one to start the game.",
			};
			await this.broadcastGameState(game.id);
		} catch (error) {
			console.error("Error blending themes:", error);
			game.gameState.selectedThemes = [game.gameState.themeVotes[0].theme];
			await this.broadcastGameState(game.id);
		}
	}

	/**
	 * Handles the player voting on the contribution.
	 */
	private async handleContributionVote({
		gameId,
		playerId,
		contributionId,
	}: {
		gameId: string;
		playerId: string;
		contributionId: number;
	}) {
		const game = this.games.get(gameId) as NarrativeRuntimeGameData;
		if (!game || !game.gameState.isReviewPhase) {
			console.log("Cannot vote at this time");
			return;
		}

		try {
			const review = game.gameState.contributionReviews.find(
				(r) => r.contributionId === contributionId,
			);

			if (!review || review.voters.includes(playerId)) {
				console.log("Invalid vote or already voted for this contribution");
				return;
			}

			review.votes++;
			review.voters.push(playerId);

			console.log("Vote recorded");
			await this.safeStateUpdate(gameId);
		} catch (error) {
			console.error("Error handling contribution vote:", error);
		}
	}

	/**
	 * Handles the player suggesting an alternative ending.
	 */
	private async handleAlternativeEnding({
		gameId,
		playerId,
		text,
	}: {
		gameId: string;
		playerId: string;
		text: string;
	}) {
		const game = this.games.get(gameId) as NarrativeRuntimeGameData;
		if (!game || !game.gameState.isReviewPhase) {
			console.log("Cannot suggest alternative ending at this time");
			return;
		}

		try {
			game.gameState.alternativeEndings.push({
				playerId,
				text,
				votes: 0,
				voters: [],
			});

			console.log("Alternative ending suggested");
			await this.safeStateUpdate(gameId);
		} catch (error) {
			console.error("Error handling alternative ending:", error);
		}
	}

	/**
	 * This finalizes the review phase by calculating the scores and ending the game.
	 */
	private async finalizeReviewPhase(game: NarrativeRuntimeGameData) {
		try {
			const topContributions = game.gameState.contributionReviews
				.sort((a, b) => b.votes - a.votes)
				.slice(0, 3);

			topContributions.forEach((review, index) => {
				const contribution =
					game.gameState.contributions[review.contributionId];
				const user = game.users.get(contribution.playerId);
				if (user) {
					user.score += (3 - index) * 10;
				}
			});

			if (game.gameState.alternativeEndings.length > 0) {
				const bestEnding = game.gameState.alternativeEndings.sort(
					(a, b) => b.votes - a.votes,
				)[0];

				game.gameState.contributions.push({
					playerId: bestEnding.playerId,
					text: bestEnding.text,
					timestamp: Date.now(),
					votes: bestEnding.votes,
				});

				const user = game.users.get(bestEnding.playerId);
				if (user) {
					user.score += 20;
				}
			}

			game.gameState.isReviewPhase = false;
			if (game) {
				game.gameState.statusMessage = {
					type: "success",
					message: "Review phase complete! Final scores have been calculated.",
				};
				game.gameState.notification = {
					type: "success",
					message: "Review phase complete! Final scores have been calculated.",
				};
			}

			await this.safeStateUpdate(game.id);
		} catch (error) {
			console.error("Error finalizing review phase:", error);
		}
	}

	/**
	 * Handles the player ending the game.
	 */
	private async handleEndGame({
		gameId,
		playerId,
	}: {
		gameId: string;
		playerId: string;
	}) {
		const game = this.games.get(gameId) as NarrativeRuntimeGameData;
		if (!game || !game.gameState.isActive) {
			console.log("Game is not active");
			return;
		}

		try {
			await this.handleGameEnd(game);
			game.gameState.statusMessage = {
				type: "success",
				message: "Game ended! Review phase starting...",
			};
			game.gameState.notification = {
				type: "info",
				message: "Review phase in progress",
			};
			await this.safeStateUpdate(gameId);
		} catch (error) {
			console.error("Error ending game:", error);
		}
	}

	/**
	 * Handles the game state and broadcasts it to the clients.
	 */
	private async handleGameState(game: NarrativeRuntimeGameData): Promise<void> {
		const gameState = { ...game.gameState };
		const users = Array.from(game.users.entries()).map(([id, user]) => ({
			id,
			name: user.name,
			score: user.score,
		}));

		await this.broadcast(
			game.id,
			JSON.stringify({
				type: "gameState",
				gameId: game.id,
				gameName: game.name,
					gameState,
					users,
			}),
		);
	}

	/**
	 * Handles the game state and broadcasts it to the clients.
	 */
	protected async broadcastGameState(gameId: string): Promise<void> {
		const game = this.games.get(gameId) as NarrativeRuntimeGameData;
		if (!game) {
			console.log("Game not found");
			return;
		}
		await this.handleGameState(game);
	}

	/**
	 * Handles the game list and broadcasts it to the clients.
	 */
	protected async handleGamesList(): Promise<void> {
		const games = Array.from(this.games.entries()).map(([id, game]) => {
			const players = Array.from(game.users.entries()).map(([id, user]) => ({
				id,
				name: user.name,
			}));

			return {
				id,
				name: game.name,
				playerCount: players.length,
				players,
				isLobby: game.gameState.isLobby,
				isActive: game.gameState.isActive,
			};
		});

		await this.broadcast(
			'*',
			JSON.stringify({
				type: "gamesList",
				games,
			}),
		);
	}

	/**
	 * Handles the game creation.
	 */
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

		const newGame: NarrativeRuntimeGameData = {
			id: gameId,
			name: gameName,
			users: new Map([[playerId, { name: playerName, score: 0 }]]),
			gameState,
			lastAIInterventionTime: Date.now(),
			reviewPhaseTimeout: null,
		};

		this.games.set(gameId, newGame);
		await this.saveGames();

		this.broadcast(gameId, {
			type: "gameCreated",
			gameId,
			gameName,
			gameState,
			creator: playerId,
			users: Array.from(newGame.users.entries()).map(([id, user]) => ({
				id,
				name: user.name,
				score: user.score,
			})),
		});

		return gameId;
	}

	/**
	 * Handles the player joining the game.
	 */
	protected async handleJoin({
		gameId,
		playerId,
		playerName,
	}: {
		gameId: string;
		playerId: string;
		playerName: string;
	}) {
		const game = this.games.get(gameId) as NarrativeRuntimeGameData;
		if (!game) {
			console.error("Game not found");
			return;
		}

		if (!game.users.has(playerId)) {
			game.users.set(playerId, { name: playerName, score: 0 });
			await this.saveGames();

			console.log(`${playerName} joined the game!`);

			await this.broadcast(
				gameId,
				JSON.stringify({
					type: "playerJoined",
					playerId,
					playerName,
					gameId,
					gameName: game.name,
					users: Array.from(game.users.entries()).map(([id, data]) => ({
						id,
						name: data.name,
						score: data.score,
					})),
				}),
			);

			await this.broadcastGameState(gameId);
		}
	}
}
