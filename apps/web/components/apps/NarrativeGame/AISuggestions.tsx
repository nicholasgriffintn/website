interface Props {
  suggestions: Array<{
    type: string;
    suggestion: string;
    votes: number;
  }>;
  onVote: (index: number) => void;
  isLoading: boolean;
}

export function AISuggestions({ suggestions, onVote, isLoading }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground mb-4">🤖 AI Suggestions</h3>
      <div className="grid gap-4">
        {suggestions.map((suggestion, index) => (
          <div
            key={`${suggestion.type}-${suggestion.suggestion.substring(0, 20)}`}
            className="bg-card rounded-lg shadow-sm border border-gray-100 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                {suggestion.votes} votes
              </span>
            </div>
            <p className="text-foreground mb-3">{suggestion.suggestion}</p>
            <button
              type="button"
              onClick={() => onVote(index)}
              disabled={isLoading}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
            >
              {isLoading ? "Voting..." : "Vote for this suggestion"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}