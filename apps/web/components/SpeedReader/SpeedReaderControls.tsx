import { Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

import { MAX_FONT_SCALE, MAX_WPM, MIN_FONT_SCALE, MIN_WPM } from "./constants";
import type { SpeedReaderController } from "./types";

export function SpeedReaderControls({ controller }: { controller: SpeedReaderController }) {
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
  const playLabel = currentIndex === 0 ? "Play" : "Resume";

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <span>Target WPM</span>
          <span>{targetWpm}</span>
        </div>
        <Slider
          aria-label="Target words per minute"
          min={MIN_WPM}
          max={MAX_WPM}
          step={10}
          value={[targetWpm]}
          onValueChange={(values) => {
            const nextValue = values[0];
            if (typeof nextValue !== "number") return;
            setTargetWpm(nextValue);
          }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <span>Font Scale</span>
          <span>{fontScale}px</span>
        </div>
        <Slider
          aria-label="Reader font scale"
          min={MIN_FONT_SCALE}
          max={MAX_FONT_SCALE}
          step={1}
          value={[fontScale]}
          onValueChange={(values) => {
            const nextValue = values[0];
            if (typeof nextValue !== "number") return;
            setFontScale(nextValue);
          }}
        />
      </div>

      <Button
        type="button"
        className="w-full"
        variant={isPaused ? "default" : "secondary"}
        onClick={togglePaused}
      >
        {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        {isPaused ? playLabel : "Pause"}
      </Button>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <Slider
          aria-label="Reader progress"
          min={0}
          max={100}
          step={0.1}
          value={[progressPercent]}
          onValueChange={(values) => {
            const nextValue = values[0];
            if (typeof nextValue !== "number") return;
            seekToPercent(nextValue);
          }}
        />
        <p className="text-xs text-muted-foreground">
          {totalWords ? `${wordsRemaining} words remaining` : "No words available"}
        </p>
      </div>
    </div>
  );
}
