interface Props {
  contribution: {
    playerId: string;
    text: string;
    timestamp: number;
  };
  user?: {
    id: string;
    name: string;
  };
}

export function StoryContribution({ contribution, user }: Props) {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-muted-foreground">
          {user?.name || 'Unknown Player'}
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date(contribution.timestamp).toLocaleTimeString()}
        </div>
      </div>
      <p className="text-foreground whitespace-pre-wrap">{contribution.text}</p>
    </div>
  );
}