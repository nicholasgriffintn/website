import { useMemo, useRef } from "react";

import type { SpeedReaderController } from "./types";
import { measureOrpOffset } from "./measurement";
import { MIN_WORDS_FOR_READER } from "./constants";

export function SpeedReaderStage({ controller }: { controller: SpeedReaderController }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { currentWord, currentIndex, fontScale, totalWords, isFinished, togglePaused } = controller;

  const orpOffset = useMemo(
    () => measureOrpOffset(currentWord, fontScale, canvasRef),
    [currentWord, fontScale],
  );

  if (!totalWords || totalWords < MIN_WORDS_FOR_READER) {
    return (
      <div className="relative min-h-[62vh] rounded-xl border bg-card/30 p-8 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {!totalWords
            ? "No readable text is available for this post."
            : "This post is too short for speed reading."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[62vh] overflow-hidden rounded-xl border bg-gradient-to-b from-background/40 to-card/40 shadow-inner">
      <div className="pointer-events-none absolute inset-y-8 left-1/2 w-px bg-border/70" />
      <div className="pointer-events-none absolute left-5 top-5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Speed Reader
      </div>
      <div className="pointer-events-none absolute bottom-5 left-5 text-xs text-muted-foreground">
        Word {currentIndex + 1} of {totalWords}
      </div>
      <div className="absolute inset-0 flex items-center justify-center px-6">
        {isFinished ? (
          <button
            type="button"
            onClick={togglePaused}
            className="flex flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <p className="text-sm">Finished — press to restart</p>
          </button>
        ) : (
          <div className="relative h-[1.8em] w-full overflow-visible">
            <span
              className="absolute top-1/2 left-1/2 whitespace-nowrap font-semibold text-foreground"
              style={{
                fontSize: `${fontScale}px`,
                lineHeight: 1.2,
                transform: `translate(${-orpOffset}px, -50%)`,
              }}
            >
              <span>{currentWord?.left}</span>
              <span className="text-red-500">{currentWord?.pivot}</span>
              <span>{currentWord?.right}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
