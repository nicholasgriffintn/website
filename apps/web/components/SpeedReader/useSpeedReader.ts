import { useEffect, useMemo, useRef, useState } from "react";

import {
  FIRST_WORD_DWELL_MULTIPLIER,
  MAX_FONT_SCALE,
  MAX_WPM,
  MIN_FONT_SCALE,
  MIN_WPM,
} from "./constants";
import { clamp } from "@/lib/utils";
import type { SpeedReaderController } from "./types";
import { buildSpeedReaderWords, getWordDelayMs } from "./words";

interface UseSpeedReaderOptions {
  text: string;
  isActive: boolean;
}

export function useSpeedReader({ text, isActive }: UseSpeedReaderOptions): SpeedReaderController {
  const words = useMemo(() => buildSpeedReaderWords(text), [text]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [targetWpm, setTargetWpm] = useState(360);
  const [fontScale, setFontScale] = useState(72);
  const wasActive = useRef(isActive);

  const totalWords = words.length;
  const currentWord = words[currentIndex] ?? null;

  useEffect(() => {
    setCurrentIndex(0);
    setIsPaused(true);
  }, [text]);

  useEffect(() => {
    if (isActive && !wasActive.current) {
      setCurrentIndex(0);
      setIsPaused(true);
    }

    if (!isActive && wasActive.current) {
      setIsPaused(true);
    }

    wasActive.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (!isActive || isPaused || !totalWords || !currentWord) return;

    if (currentIndex >= totalWords - 1) {
      setIsPaused(true);
      return;
    }

    let delay = getWordDelayMs(currentWord.raw, targetWpm);
    if (currentIndex === 0) delay *= FIRST_WORD_DWELL_MULTIPLIER;

    const timeoutId = window.setTimeout(() => {
      setCurrentIndex((index) => Math.min(index + 1, totalWords - 1));
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [currentIndex, currentWord, isActive, isPaused, targetWpm, totalWords]);

  const progressPercent = totalWords > 1 ? (currentIndex / (totalWords - 1)) * 100 : 0;
  const isFinished = totalWords > 0 && currentIndex >= totalWords - 1 && isPaused;

  const seekToPercent = (percent: number) => {
    if (!totalWords) return;
    const clampedPercent = clamp(percent, 0, 100);
    const index = Math.round((clampedPercent / 100) * (totalWords - 1));
    setCurrentIndex(index);
  };

  const togglePaused = () => {
    if (!totalWords) return;

    setIsPaused((paused) => {
      if (paused && currentIndex >= totalWords - 1) {
        setCurrentIndex(0);
      }
      return !paused;
    });
  };

  return {
    currentWord,
    currentIndex,
    totalWords,
    isPaused,
    isFinished,
    targetWpm,
    fontScale,
    progressPercent,
    setTargetWpm: (value) => setTargetWpm(clamp(value, MIN_WPM, MAX_WPM)),
    setFontScale: (value) => setFontScale(clamp(value, MIN_FONT_SCALE, MAX_FONT_SCALE)),
    seekToPercent,
    togglePaused,
  };
}
