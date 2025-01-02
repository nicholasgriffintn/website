'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { SUGGESTED_THEMES } from "../constants";

interface Props {
  availableGames: Array<{ id: string; name: string; playerCount: number }>;
  onCreateGame: (name: string) => void;
  onJoinGame: (gameId: string) => void;
  gameState?: {
    isLobby: boolean;
    themeVotes: Array<{ playerId: string; theme: string }>;
    selectedThemes: string[];
  };
  onSubmitTheme?: (theme: string) => void;
  onStartGame?: (theme: string) => void;
  users?: Array<{ id: string; name: string }>;
  isLoading?: boolean;
}

export function GameLobby({
  availableGames,
  onCreateGame,
  onJoinGame,
  gameState,
  onSubmitTheme,
  onStartGame,
  users = [],
}: Props) {
  const [gameName, setGameName] = useState("");

  if (gameState?.isLobby && users.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Game Lobby</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Players</h3>
            <ul className="space-y-1">
              {users.map((user) => (
                <li key={user.id} className="text-muted-foreground">
                  {user.name}
                </li>
              ))}
            </ul>
          </div>

          {gameState.selectedThemes.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold mb-2">Selected Themes</h3>
              <div className="space-y-2">
                {gameState.selectedThemes.map((theme) => (
                  <Card key={theme}>
                    <CardContent className="flex items-center justify-between p-4">
                      <span>{theme}</span>
                      <Button onClick={() => onStartGame?.(theme)} variant="default">
                        Start with this theme
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-2">Vote for a Theme</h3>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTED_THEMES.map((theme) => (
                  <Button
                    key={theme}
                    onClick={() => onSubmitTheme?.(theme)}
                    variant="outline"
                    disabled={gameState.themeVotes.some(
                      (vote) => vote.theme === theme
                    )}
                  >
                    {theme}
                    {gameState.themeVotes.some((vote) => vote.theme === theme) &&
                      " (Voted)"}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Create New Game</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (gameName) {
              onCreateGame(gameName);
              setGameName("");
            }
          }}
          className="flex gap-2"
        >
          <Input
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="Enter game name..."
            required
          />
          <Button type="submit">Create Game</Button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Available Games</h2>
        {availableGames.length === 0 ? (
          <p className="text-muted-foreground">No games available. Create one to start!</p>
        ) : (
          <div className="space-y-2">
            {availableGames.map((game) => (
              <div key={game.id} className="flex items-center justify-between p-4 bg-card rounded-lg shadow">
                <div>
                  <h3 className="font-medium">{game.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Players: {game.playerCount}
                  </p>
                </div>
                <Button onClick={() => onJoinGame(game.id)} variant="default">
                  Join Game
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

