"use client";

import { useNarrativeGame } from "./hooks/useNarrativeGame";
import { StatusMessage } from "./components/StatusMessage";
import { GameLobby } from "./components/GameLobby";
import { GameHeader } from "./components/GameHeader";
import { GameContent } from "./components/GameContent";
import { ConnectionStatus } from "./components/ConnectionStatus";

interface Props {
  playerId: string;
  playerName: string;
  initialGameId?: string;
}

export function NarrativeGame({ playerId, playerName, initialGameId }: Props) {
  const {
    gameState,
    users,
    isLoading,
    availableGames,
    statusMessage: connectionMessage,
    isConnected,
    createGame,
    submitContribution,
    voteOnSuggestion,
    requestAIIntervention,
    joinGame,
    endGame,
    leaveGame,
    submitContributionVote,
    submitAlternativeEnding,
    submitThemeVote,
    startGame,
  } = useNarrativeGame(playerId, playerName);

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <div className="col-span-full flex flex-col gap-2">
        <ConnectionStatus 
          isConnected={isConnected}
          connectionMessage={connectionMessage}
        />

        {(gameState.notification || gameState.statusMessage) && (
          <div className="space-y-2">
            {gameState.notification && (
              <StatusMessage
                type={gameState.notification.type}
                message={gameState.notification.message}
              />
            )}
            {gameState.statusMessage && (
              <StatusMessage
                type={gameState.statusMessage.type}
                message={gameState.statusMessage.message}
              />
            )}
          </div>
        )}
      </div>

      <div className="col-span-full">
        {!gameState.gameId || gameState.isLobby ? (
          <GameLobby
            availableGames={availableGames}
            onCreateGame={createGame}
            onJoinGame={joinGame}
            isLoading={isLoading}
            gameState={gameState}
            users={users}
            onSubmitTheme={submitThemeVote}
            onStartGame={startGame}
          />
        ) : (
          <div className="space-y-4">
            <GameHeader
              gameState={gameState}
              users={users}
              playerId={playerId}
              onEndGame={endGame}
              onLeaveGame={leaveGame}
            />
            <GameContent
              gameState={gameState}
              users={users}
              playerId={playerId}
              isLoading={isLoading}
              onSubmitContribution={submitContribution}
              onVoteOnSuggestion={voteOnSuggestion}
              onRequestAIIntervention={requestAIIntervention}
              onSubmitContributionVote={submitContributionVote}
              onSubmitAlternativeEnding={submitAlternativeEnding}
            />
          </div>
        )}
      </div>
    </div>
  );
}

