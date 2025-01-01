"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import type {
	NarrativeGameState,
	User,
	GameListItem,
	StatusMessage,
} from "../types";

const BASE_URL =
	process.env.NODE_ENV === "development"
		? "ws://localhost:8786"
		: "wss://website-multiplayer.nickgriffin.uk";

export function useNarrativeGame(
	playerId: string,
	playerName: string,
) {
	const [gameState, setGameState] = useState<NarrativeGameState>(() => ({
		gameId: undefined,
		currentTurn: undefined,
		isActive: false,
		isLobby: true,
		theme: "",
		timeRemaining: 0,
		contributions: [],
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
	}));
	const [users, setUsers] = useState<Array<User>>([]);
	const [isConnected, setIsConnected] = useState(false);
	const [availableGames, setAvailableGames] = useState<GameListItem[]>([]);
	const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const wsRef = useRef<WebSocket | null>(null);

	const sendAction = useCallback((action: string, data: any) => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
			setStatusMessage({
				type: "error",
				message: "Not connected to server",
			});
			return;
		}
		console.log('Sending action:', { action, ...data });
		setIsLoading(true);
		wsRef.current.send(JSON.stringify({ action, ...data }));
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: gameState updates too often
	useEffect(() => {
		const ws = new WebSocket(`${BASE_URL}/plot-twist`);
		wsRef.current = ws;

		ws.onopen = () => {
			console.log("WebSocket connected");
			setIsConnected(true);
			setStatusMessage({
				type: "success",
				message: "Connected to game server",
			});
			ws.send(JSON.stringify({ action: "getGames" }));

			if (gameState.gameId) {
				ws.send(
					JSON.stringify({
						action: "join",
						gameId: gameState.gameId,
						playerId,
						playerName,
					}),
				);
			}
		};

		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				console.log('Received message:', data);
				setIsLoading(false);

				switch (data.type) {
					case "gameState":
						console.log('Updating game state:', data.gameState);
						if (data.gameState.isActive && !data.gameState.contributions.length) {
							data.gameState.hasEnded = false;
						}
						setGameState({
							...data.gameState,
							gameId: data.gameId,
							gameName: data.gameName,
						});
						setUsers(data.users);
						setStatusMessage(data.gameState.statusMessage || null);
						break;
					case "gamesList":
						setAvailableGames(data.games);
						break;
					case "gameCreated":
						if (data.creator === playerId) {
							setGameState({
								...data.gameState,
								gameId: data.gameId,
								gameName: data.gameName,
							});
							setUsers(data.users);
						}
						ws.send(JSON.stringify({ action: "getGames" }));
						break;
					case "playerJoined":
						console.log('Player joined:', data);
						setGameState(prevState => ({
							...prevState,
							gameId: data.gameId,
							gameName: data.gameName,
							isLobby: true,
						}));
						setUsers(data.users);
						break;
				}
			} catch (error) {
				setIsLoading(false);
				console.error("Error parsing WebSocket message:", error);
				setStatusMessage({
					type: "error",
					message: "Error processing server message",
				});
			}
		};

		ws.onclose = () => {
			console.log("WebSocket closed");
			setIsConnected(false);
			setIsLoading(false);
			setStatusMessage({
				type: "warning",
				message: "Connection lost. Please refresh the page to reconnect.",
			});

			setTimeout(() => {
				if (wsRef.current?.readyState === WebSocket.CLOSED) {
					wsRef.current = null;
				}
			}, 5000);
		};

		ws.onerror = (error) => {
			console.error("WebSocket error:", error);
			setIsConnected(false);
			setStatusMessage({
				type: "error",
				message: "Connection error occurred",
			});
		};

		return () => {
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(
					JSON.stringify({
						action: "leave",
						playerId,
					}),
				);
				ws.close();
			}
		};
	}, [playerId, playerName]);

	useEffect(() => {
		if (gameState.gameId && wsRef.current?.readyState === WebSocket.OPEN) {
			console.log("Rejoining game:", gameState.gameId);
			wsRef.current.send(
				JSON.stringify({
					action: "join",
					gameId: gameState.gameId,
					playerId,
					playerName,
				}),
			);
		}
	}, [gameState.gameId, playerId, playerName]);

	const createGame = useCallback(
		async (gameName: string) => {
			sendAction("createGame", { gameName, playerId, playerName });
		},
		[playerId, playerName, sendAction],
	);

	const joinGame = useCallback(
		(gameId: string) => {
			sendAction("join", { gameId, playerId, playerName });
		},
		[playerId, playerName, sendAction],
	);

	const submitContribution = useCallback(
		(contribution: string) => {
			console.log('Submitting contribution:', { gameId: gameState.gameId, playerId, contribution });
			if (!gameState.isActive) {
				setStatusMessage({
					type: "error",
					message: "Game is not active",
				});
				return;
			}
			if (gameState.currentTurn !== playerId) {
				setStatusMessage({
					type: "error",
					message: "It's not your turn",
				});
				return;
			}
			sendAction("addContribution", { gameId: gameState.gameId, playerId, contribution });
		},
		[gameState.gameId, playerId, sendAction, gameState.isActive, gameState.currentTurn],
	);

	const voteOnSuggestion = useCallback(
		(suggestionIndex: number) => {
			sendAction("voteOnSuggestion", { gameId: gameState.gameId, playerId, suggestionIndex });
		},
		[gameState.gameId, playerId, sendAction],
	);

	const requestAIIntervention = useCallback(() => {
		if (!gameState.gameId) return;
		sendAction("requestAIIntervention", { gameId: gameState.gameId });
	}, [gameState.gameId, sendAction]);

	const startGame = useCallback((theme: string) => {
		if (!gameState.gameId) return;
		sendAction("startGame", { gameId: gameState.gameId, theme });
	}, [gameState.gameId, sendAction]);

	const submitThemeVote = useCallback((theme: string) => {
		if (!gameState.gameId) return;
		sendAction("themeVote", { gameId: gameState.gameId, playerId, theme });
	}, [gameState.gameId, playerId, sendAction]);

	const endGame = useCallback(() => {
		if (!gameState.gameId) return;
		sendAction('endGame', { gameId: gameState.gameId, playerId });
	}, [gameState.gameId, playerId, sendAction]);

	const leaveGame = useCallback(() => {
		if (!gameState.gameId) return;
		sendAction('leave', { gameId: gameState.gameId, playerId });
		setGameState(prevState => ({
			...prevState,
			gameId: undefined,
			isLobby: true,
		}));
	}, [gameState.gameId, playerId, sendAction]);

	return {
		gameState,
		users,
		isConnected,
		isLoading,
		availableGames,
		statusMessage,
		createGame,
		joinGame,
		submitContribution,
		voteOnSuggestion,
		requestAIIntervention,
		startGame,
		submitThemeVote,
		endGame,
		leaveGame,
	};
}
