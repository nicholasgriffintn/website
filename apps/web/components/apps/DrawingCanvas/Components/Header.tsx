import { Button } from "@/components/ui/button";
import { Undo2, Redo2 } from "lucide-react";

interface HeaderProps {
	undo: () => void;
	redo: () => void;
	history: ImageData[];
	historyIndex: number;
}

export function Header({ undo, redo, history, historyIndex }: HeaderProps) {
	return (
		<div className="flex items-center justify-between">
			<h3 className="text-lg font-medium">Drawing Tools</h3>
			<div className="flex gap-2">
				<Button
					variant="outline"
					size="icon"
					onClick={undo}
					disabled={historyIndex <= 0}
					className="h-8 w-8"
					title="Undo"
				>
					<Undo2 className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					onClick={redo}
					disabled={historyIndex >= history.length - 1}
					className="h-8 w-8"
					title="Redo"
				>
					<Redo2 className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
