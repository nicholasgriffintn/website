import type { MutableRefObject } from "react";

import type { SpeedReaderWord } from "./types";

function getFallbackOrpOffset(word: SpeedReaderWord, fontScale: number) {
  return (word.left.length + 0.5) * fontScale * 0.56;
}

export function measureOrpOffset(
  word: SpeedReaderWord | null,
  fontScale: number,
  canvasRef: MutableRefObject<HTMLCanvasElement | null>,
) {
  if (!word) return 0;
  const fallbackOffset = getFallbackOrpOffset(word, fontScale);

  if (typeof document === "undefined") return fallbackOffset;
  if (!canvasRef.current) canvasRef.current = document.createElement("canvas");

  const context = canvasRef.current.getContext("2d");
  if (!context) return fallbackOffset;

  context.font = `600 ${fontScale}px ui-sans-serif, system-ui, sans-serif`;
  const leftWidth = context.measureText(word.left).width;
  const pivotWidth = context.measureText(word.pivot || " ").width;

  return leftWidth + pivotWidth / 2;
}
