export interface SpeedReaderWord {
  raw: string;
  left: string;
  pivot: string;
  right: string;
}

export interface SpeedReaderController {
  currentWord: SpeedReaderWord | null;
  currentIndex: number;
  totalWords: number;
  isPaused: boolean;
  isFinished: boolean;
  targetWpm: number;
  fontScale: number;
  progressPercent: number;
  setTargetWpm: (value: number) => void;
  setFontScale: (value: number) => void;
  seekToPercent: (percent: number) => void;
  togglePaused: () => void;
}
