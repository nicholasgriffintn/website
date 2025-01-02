import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { User, NarrativeGameState } from "../types";

interface Props {
  gameState: NarrativeGameState;
  users: User[];
  playerId: string;
  onEndGame: () => void;
  onLeaveGame: () => void;
}

export function GameHeader({ gameState, users, playerId, onEndGame, onLeaveGame }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Plot Twist</h1>
          <div className="space-x-2">
            {gameState.isActive && !gameState.hasEnded && !gameState.isReviewPhase && (
              <Button onClick={onEndGame} variant="destructive">
                End Game
              </Button>
            )}
            <Button onClick={onLeaveGame} variant="secondary">
              Leave Game
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Current Turn: </span>
            <span className="text-foreground font-bold">
              {users.find((u) => u.id === gameState.currentTurn)?.name || "Loading..."}
              {gameState.currentTurn === playerId && " (You)"}
            </span>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Game Status: </span>
            <span className={`font-bold ${gameState.isActive ? "text-green-600" : "text-red-600"}`}>
              {gameState.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}