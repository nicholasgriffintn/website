import { useState, useEffect, useCallback, useRef } from "react";
import type { GameState, User, GameListItem } from "../types";
import { DEFAULT_GAME_STATE } from "../constants";

const BASE_URL =
	process.env.NODE_ENV === "development"
		? "ws://localhost:8786"
		: "wss://website-multiplayer.nickgriffin.uk";

export function useGameState(
	initialGameId: string | null = null,
	playerId: string,
	playerName: string,
	clearCanvas?: () => void,
) {
	const [gameState, setGameState] = useState<GameState>({
		...DEFAULT_GAME_STATE,
		gameId: initialGameId,
	});
	const [users, setUsers] = useState<Array<User>>([]);
	const [isConnected, setIsConnected] = useState(false);
	const [availableGames, setAvailableGames] = useState<GameListItem[]>([]);
	const wsRef = useRef<WebSocket | null>(null);

	useEffect(() => {
		const ws = new WebSocket(`${BASE_URL}/anyone-can-draw`);
		wsRef.current = ws;

		ws.onopen = () => {
			setIsConnected(true);
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

				switch (data.type) {
					case "gamesList":
						setAvailableGames(data.games);
						break;
					case "gameState": {
						const isParticipant = data.users.some(
							(user: User) => user.id === playerId,
						);

						if (isParticipant) {
							setGameState((prevState) => ({
								...prevState,
								...data.gameState,
								gameId: data.gameId,
								gameName: data.gameName,
							}));
							setUsers(data.users);
						} else if (data.gameId === gameState.gameId) {
							setGameState((prevState) => ({
								...prevState,
								gameId: null,
								gameName: "",
								isActive: false,
								isLobby: true,
							}));
							setUsers([]);
						}
						break;
					}
					case "drawingUpdate":
						setGameState((prevState) => ({
							...prevState,
							drawingData: data.drawingData,
						}));
						break;
					case "gameCreated":
						if (data.users.some((user: User) => user.id === playerId)) {
							setGameState((prevState) => ({
								...prevState,
								...data.gameState,
								gameId: data.gameId,
								gameName: data.gameName,
							}));
							setUsers(data.users);
						}
						ws.send(JSON.stringify({ action: "getGames" }));
						break;
					case "gameStarted":
						clearCanvas?.();
						break;
					case "gameEnded":
						setGameState(data.gameState);
						setUsers(data.users);
						break;
					case "error":
						console.error("Game error:", data.message);
						break;
				}
			} catch (error) {
				console.error("Error parsing WebSocket message:", error);
			}
		};

		ws.onclose = () => {
			setIsConnected(false);
			console.info("WebSocket closed");
			setTimeout(() => {
				if (wsRef.current?.readyState === WebSocket.CLOSED) {
					wsRef.current = null;
				}
			}, 5000);
		};

		ws.onerror = (error) => {
			console.error("WebSocket error:", error);
			setIsConnected(false);
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

	const createGame = useCallback(
		async (gameName: string) => {
			if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
				console.error("WebSocket not connected");
				return;
			}

			wsRef.current.send(
				JSON.stringify({
					action: "createGame",
					gameName,
					playerId,
					playerName,
				}),
			);
		},
		[playerId, playerName],
	);

	const joinGame = useCallback(
		async (gameIdToJoin: string) => {
			if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
				console.error("WebSocket not connected");
				return;
			}

			wsRef.current.send(
				JSON.stringify({
					action: "join",
					gameId: gameIdToJoin,
					playerId,
					playerName,
				}),
			);
		},
		[playerId, playerName],
	);

	const startGame = useCallback(async () => {
		if (
			!wsRef.current ||
			wsRef.current.readyState !== WebSocket.OPEN ||
			!gameState.gameId
		) {
			console.error("WebSocket not connected or no gameId");
			return;
		}

		wsRef.current.send(
			JSON.stringify({
				action: "startGame",
				gameId: gameState.gameId,
				playerId,
			}),
		);
	}, [gameState.gameId, playerId]);

	const endGame = useCallback(async () => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
			console.error("WebSocket not connected");
			return;
		}

		wsRef.current.send(
			JSON.stringify({
				action: "leave",
				gameId: gameState.gameId,
				playerId,
			}),
		);
	}, [gameState.gameId, playerId]);

	const leaveGame = useCallback(() => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
			console.error("WebSocket not connected");
			return;
		}

		wsRef.current.send(
			JSON.stringify({
				action: "leave",
				gameId: gameState.gameId,
				playerId,
			}),
		);

		setGameState((prevState) => ({
			...prevState,
			gameId: null,
			gameName: "",
			isActive: false,
			isLobby: true,
		}));
		setUsers([]);

		wsRef.current.send(JSON.stringify({ action: "getGames" }));
	}, [playerId, gameState.gameId]);

	const updateDrawing = useCallback(
		async (drawingData: string) => {
			if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
				return;
			}

			wsRef.current.send(
				JSON.stringify({
					action: "updateDrawing",
					gameId: gameState.gameId,
					drawingData,
				}),
			);
		},
		[gameState.gameId, playerId],
	);

	const submitGuess = useCallback(
		async (guess: string) => {
			if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
				console.error("WebSocket not connected");
				return;
			}

			wsRef.current.send(
				JSON.stringify({
					action: "submitGuess",
					gameId: gameState.gameId,
					playerId,
					guess,
				}),
			);
		},
		[gameState.gameId, playerId],
	);

	return {
		isConnected,
		gameState,
		users,
		availableGames,
		createGame,
		joinGame,
		startGame,
		endGame,
		leaveGame,
		updateDrawing,
		submitGuess,
	};
}
