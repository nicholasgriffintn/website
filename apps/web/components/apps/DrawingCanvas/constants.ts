export const COLORS = [
	// Grayscale
	"#030712", // Black
	"#4b5563", // Gray
	"#f9fafb", // White
	// Primary colors
	"#ef4444", // Red
	"#f59e0b", // Orange
	"#fbbf24", // Yellow
	"#22c55e", // Green
	"#3b82f6", // Blue
	"#6366f1", // Indigo
	"#a855f7", // Purple
	// Pastel colors
	"#fecaca", // Light Red
	"#fed7aa", // Light Orange
	"#fef08a", // Light Yellow
	"#bbf7d0", // Light Green
	"#bfdbfe", // Light Blue
	"#c7d2fe", // Light Indigo
	"#e9d5ff", // Light Purple
	// Additional colors
	"#ec4899", // Pink
	"#14b8a6", // Teal
	"#964B00", // Brown
];

export const LINE_WIDTHS = [2, 4, 6, 8, 12, 16];

export const GAME_DURATION = 120; // 2 minutes in seconds

export const DEFAULT_GAME_STATE = {
		isActive: false,
		isLobby: true,
		gameName: "",
		targetWord: "",
		timeRemaining: GAME_DURATION,
		guesses: [],
		hasWon: false,
		currentDrawer: undefined,
		endTime: undefined,
		statusMessage: undefined,
		drawingData: undefined,
	}