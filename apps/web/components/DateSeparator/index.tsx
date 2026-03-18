export function DateSeparator({ date }) {
  return (
    <div className="border-b mb-2 w-full flex items-center space-x-2 rounded px-2 py-1 text-xs text-muted-foreground">
      {date.toLocaleDateString()}
    </div>
  );
}
