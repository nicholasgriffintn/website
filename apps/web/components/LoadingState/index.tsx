import { Spinner } from "@/components/Spinner";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  className?: string;
  spinnerClassName?: string;
};

export function LoadingState({
  label = "Loading...",
  className,
  spinnerClassName,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-2", className)}
    >
      <Spinner className={cn("h-4 w-4 text-muted-foreground", spinnerClassName)} />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
