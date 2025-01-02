"use client";

import { useNarrativeGame } from "./hooks/useNarrativeGame";
import { StatusMessage } from "./components/StatusMessage";
import { GameLobby } from "./components/GameLobby";
import { GameHeader } from "./components/GameHeader";
import { GameContent } from "./components/GameContent";

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
    statusMessage,
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
      <div className="col-span-full">
        {statusMessage && (
          <StatusMessage
            type={statusMessage.type}
            message={statusMessage.message}
          />
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

