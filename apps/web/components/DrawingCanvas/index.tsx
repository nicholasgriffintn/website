"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

import type { DrawingResponse, DrawingCanvasProps } from "./types";
import { ColorPicker } from "./Components/ColorPicker";
import { LineWidthPicker } from "./Components/LineWidthPicker";
import { ToolPicker } from "./Components/ToolPicker";
import { Header } from "./Components/Header";
import { Result } from "./Components/Result";
import { Canvas } from "./Components/Canvas";
import { useGameState } from "./hooks/useGameState";
import { GameStatus } from "./Components/GameStatus";
import Chat from "./Components/Chat";
import { GenerateDrawing } from "./Components/GenerateDrawing";

export function DrawingCanvas({
	user,
	onSubmit,
	result,
	gameMode,
	gameId,
}: DrawingCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [loading, setLoading] = useState(false);
	const [apiResult, setApiResult] = useState<DrawingResponse | null>(null);
	const [currentColor, setCurrentColor] = useState("#030712");
	const [lineWidth, setLineWidth] = useState(3);
	const [isFillMode, setIsFillMode] = useState(false);
	const [history, setHistory] = useState<ImageData[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);
	const [isToolsOpen, setIsToolsOpen] = useState(false);

	const saveToHistory = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!ctx || !canvas) return;

		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const newHistory = history.slice(0, historyIndex + 1);
		newHistory.push(imageData);

		setHistory(newHistory);
		setHistoryIndex(newHistory.length - 1);
	};

	const undo = () => {
		if (historyIndex <= 0) return;

		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!ctx || !canvas) return;

		const newIndex = historyIndex - 1;
		const imageData = history[newIndex];
		if (!imageData) return;

		ctx.putImageData(imageData, 0, 0);
		setHistoryIndex(newIndex);
	};

	const redo = () => {
		if (historyIndex >= history.length - 1) return;

		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!ctx || !canvas) return;

		const newIndex = historyIndex + 1;
		const imageData = history[newIndex];
		if (!imageData) return;

		ctx.putImageData(imageData, 0, 0);
		setHistoryIndex(newIndex);
	};

	const clearCanvas = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!ctx || !canvas) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		saveToHistory();
	};

	const initCanvas = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!ctx || !canvas) return;

		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		setHistory([imageData]);
		setHistoryIndex(0);
	};

	useEffect(() => {
		initCanvas();
	}, []);

	useEffect(() => {
		const handleKeyboard = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "z") {
				if (e.shiftKey) {
					redo();
				} else {
					undo();
				}
			}
		};

		window.addEventListener("keydown", handleKeyboard);
		return () => window.removeEventListener("keydown", handleKeyboard);
	}, [historyIndex, history]);

	const handleSubmit = async () => {
		setLoading(true);
		try {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const drawingData = canvas.toDataURL("image/png");
			const response = await onSubmit(drawingData);
			setApiResult(response);
		} catch (error) {
			console.error("Error submitting drawing:", error);
		} finally {
			setLoading(false);
		}
	};

	const playerId = user?.username;
	const playerName = user?.name;

	if (!playerId || !playerName) {
		return <div>Loading...</div>;
	}

	const {
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
	} = useGameState(gameId, playerId, playerName, clearCanvas);

	const handleDrawingComplete = async () => {
		if (
			gameState.isActive &&
			canvasRef.current &&
			gameState.currentDrawer === playerId
		) {
			const drawingData = canvasRef.current.toDataURL("image/png");
			await updateDrawing(drawingData);
		}
	};

	const isDrawer = gameState.currentDrawer === playerId;

	const displaySidebar =
		!gameState.isActive || (gameState.isActive && isDrawer);

	const DrawingTools = () => (
		<div className="flex flex-col gap-4 p-4 bg-card rounded-lg border shadow-sm">
			<Header
				undo={undo}
				redo={redo}
				history={history}
				historyIndex={historyIndex}
			/>

			<ToolPicker isFillMode={isFillMode} setIsFillMode={setIsFillMode} />

			<LineWidthPicker lineWidth={lineWidth} setLineWidth={setLineWidth} />

			<ColorPicker
				currentColor={currentColor}
				setCurrentColor={setCurrentColor}
			/>

			<Button
				onClick={clearCanvas}
				variant="outline"
				size="sm"
				className="w-full text-muted-foreground"
			>
				Clear Canvas
			</Button>
		</div>
	);

	return (
		<div className="flex flex-col gap-4 w-full mx-auto">
			<div className="flex flex-col lg:flex-row gap-4">
				{!result && (
					<div className="flex flex-col lg:flex-row gap-4 w-full">
						{displaySidebar && (
							<div className="w-full lg:w-64 hidden lg:flex flex-col gap-4">
								<DrawingTools />
							</div>
						)}

						<div className="flex-1 flex flex-col gap-4">
							{displaySidebar && (
								<div className="lg:hidden">
									<Sheet open={isToolsOpen} onOpenChange={setIsToolsOpen}>
										<SheetTrigger asChild>
											<Button variant="outline" className="w-full">
												<Menu className="mr-2 h-4 w-4" /> Drawing Tools
											</Button>
										</SheetTrigger>
										<SheetContent side="bottom" className="h-[80vh]">
											<SheetHeader>
												<SheetTitle>Drawing Tools</SheetTitle>
											</SheetHeader>
											<DrawingTools />
										</SheetContent>
									</Sheet>
								</div>
							)}

							<Canvas
								canvasRef={canvasRef}
								isFillMode={isFillMode}
								currentColor={currentColor}
								lineWidth={lineWidth}
								saveToHistory={saveToHistory}
								onDrawingComplete={handleDrawingComplete}
								isReadOnly={gameState.isActive && !isDrawer}
								drawingData={gameState.drawingData}
							/>
						</div>

						<div className="w-full lg:w-80 flex flex-col gap-4">
							{!gameState.isActive && (
								<GenerateDrawing
									handleSubmit={handleSubmit}
									loading={loading}
									gameState={gameState}
								/>
							)}

							{gameMode && (
								<>
									<div className="bg-card rounded-lg border shadow-sm">
										<GameStatus
											users={users}
											gameState={gameState}
											availableGames={availableGames}
											onCreateGame={createGame}
											onJoinGame={joinGame}
											onStartGame={startGame}
											onEndGame={endGame}
											onLeaveGame={leaveGame}
											isConnected={isConnected}
											isDrawer={isDrawer}
										/>
									</div>

									{gameState.isActive && (
										<Chat
											gameState={gameState}
											onGuess={submitGuess}
											isDrawer={isDrawer}
										/>
									)}
								</>
							)}
						</div>
					</div>
				)}

				{result && <Result apiResult={apiResult} />}
			</div>
		</div>
	);
}
