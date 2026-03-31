import { Pause, Play, Minus, Plus, Settings } from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import {
  MIN_WPM,
  MAX_WPM,
  MIN_FONT_SCALE,
  MAX_FONT_SCALE,
} from "@/components/SpeedReader/constants";
import type { SpeedReaderController } from "@/components/SpeedReader";
import { Button } from "@/components/ui/button";

const WPM_STEP = 30;

export function FocusPanel({ controller }: { controller: SpeedReaderController }) {
  const {
    currentIndex,
    totalWords,
    isPaused,
    targetWpm,
    fontScale,
    progressPercent,
    setTargetWpm,
    setFontScale,
    seekToPercent,
    togglePaused,
  } = controller;

  const wordsRemaining = Math.max(totalWords - currentIndex - 1, 0);

  return (
    <div className="rounded-lg border bg-background/50 px-4 py-3 space-y-3">
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={togglePaused}
          aria-label={isPaused ? "Play" : "Pause"}
        >
          {isPaused ? <Play className="h-3.5 w-3.5 ml-0.5" /> : <Pause className="h-3.5 w-3.5" />}
        </Button>

        <div className="flex flex-1 items-center gap-1 rounded-md border px-1">
          <button
            type="button"
            onClick={() => setTargetWpm(targetWpm - WPM_STEP)}
            disabled={targetWpm <= MIN_WPM}
            className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            aria-label="Decrease speed"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="flex-1 text-center text-xs font-medium tabular-nums">
            {targetWpm} <span className="text-[10px] font-normal text-muted-foreground">wpm</span>
          </span>
          <button
            type="button"
            onClick={() => setTargetWpm(targetWpm + WPM_STEP)}
            disabled={targetWpm >= MAX_WPM}
            className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            aria-label="Increase speed"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Reader settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" side="bottom" align="end">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Font size</span>
                <span>{fontScale}px</span>
              </div>
              <Slider
                aria-label="Reader font scale"
                min={MIN_FONT_SCALE}
                max={MAX_FONT_SCALE}
                step={1}
                value={[fontScale]}
                onValueChange={(values) => {
                  const v = values[0];
                  if (typeof v === "number") setFontScale(v);
                }}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-1">
        <Slider
          aria-label="Reader progress"
          min={0}
          max={100}
          step={0.1}
          value={[progressPercent]}
          className="[&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5"
          onValueChange={(values) => {
            const v = values[0];
            if (typeof v === "number") seekToPercent(v);
          }}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
          <span>{Math.round(progressPercent)}%</span>
          <span>{wordsRemaining} words left</span>
        </div>
      </div>
    </div>
  );
}
