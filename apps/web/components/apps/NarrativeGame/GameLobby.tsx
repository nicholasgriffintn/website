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

const SUGGESTED_THEMES = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Horror",
  "Romance",
  "Adventure",
  "Historical Fiction",
  "Comedy",
];

export function GameLobby({
  availableGames,
  onCreateGame,
  onJoinGame,
  gameState,
  onSubmitTheme,
  onStartGame,
  users = [],
}: Props) {
  if (gameState?.isLobby && users.length > 0) {
    return (
      <div className="w-full">
        <h2 className="text-xl font-bold mb-4">Game Lobby</h2>
        <div className="mb-4">
          <h3 className="font-medium mb-2">Players</h3>
          <ul className="space-y-1">
            {users.map((user) => (
              <li key={user.id} className="text-muted-foreground">
                {user.name}
              </li>
            ))}
          </ul>
        </div>

        {gameState.selectedThemes.length > 0 ? (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Selected Themes</h3>
            <div className="space-y-2">
              {gameState.selectedThemes.map((theme) => (
                <div key={theme} className="flex items-center justify-between p-2 border rounded bg-card">
                  <span>{theme}</span>
                  <button
                    type="button"
                    onClick={() => onStartGame?.(theme)}
                    className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                  >
                    Start with this theme
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Vote for a Theme</h3>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTED_THEMES.map((theme) => (
                <button
                  type="button"
                  key={theme}
                  onClick={() => onSubmitTheme?.(theme)}
                  className="p-2 border rounded hover:bg-gray-50 hover:text-black text-foreground bg-card"
                  disabled={gameState.themeVotes.some(
                    (vote) => vote.theme === theme
                  )}
                >
                  {theme}
                  {gameState.themeVotes.some((vote) => vote.theme === theme) &&
                    " (Voted)"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-full">
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Create New Game</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const gameName = formData.get('gameName') as string;
            if (gameName) {
              onCreateGame(gameName);
              e.currentTarget.reset();
            }
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            name="gameName"
            placeholder="Enter game name..."
            className="flex-1 p-2 border rounded"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Game
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Available Games</h2>
        {availableGames.length === 0 ? (
          <p className="text-muted-foreground">No games available. Create one to start!</p>
        ) : (
          <div className="space-y-2">
            {availableGames.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between p-4 border rounded bg-card"
              >
                <div>
                  <h3 className="font-medium">{game.name}</h3>
                  <p className="text-sm text-gray-500">
                    Players: {game.playerCount}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onJoinGame(game.id)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Join Game
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}