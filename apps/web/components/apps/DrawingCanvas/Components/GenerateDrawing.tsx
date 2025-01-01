import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GameState } from "../types";

export function GenerateDrawing({
	handleSubmit,
	loading,
	gameState,
}: {
	handleSubmit: () => void;
	loading: boolean;
	gameState: GameState;
}) {
	return (
		<div className="bg-card p-4 rounded-lg border shadow-sm">
			<div className="prose dark:prose-invert mb-4">
				<h3 className="text-lg font-medium">Generate AI Art</h3>
				<p className="text-sm text-muted-foreground">
					Draw anything you like and get an AI-generated painting based on your
					drawing.
				</p>
			</div>
			<Button
				onClick={handleSubmit}
				disabled={loading || gameState.isActive}
				className="w-full"
				size="lg"
				variant="default"
			>
				{loading ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Generating...
					</>
				) : (
					"Submit Drawing"
				)}
			</Button>
		</div>
	);
}
