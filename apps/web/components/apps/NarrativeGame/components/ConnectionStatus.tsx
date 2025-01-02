import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { StatusMessage as StatusMessageType } from "../types";

interface Props {
  isConnected: boolean;
  connectionMessage: StatusMessageType | null;
}

export function ConnectionStatus({ isConnected, connectionMessage }: Props) {
  return (
    <div className="flex justify-end">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-red-500",
                  "animate-pulse"
                )}
              />
              <span className="text-xs text-muted-foreground">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {connectionMessage?.message || (isConnected ? "Connected to game server" : "Not connected to game server")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
} 