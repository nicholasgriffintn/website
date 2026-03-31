import { HARD_STOP_REGEX, MIN_WPM, SOFT_STOP_REGEX, WORD_CHARACTER_REGEX } from "./constants";
import type { SpeedReaderWord } from "./types";

const NARROW_CHARS = new Set(["i", "I", "j", "l", "r", "t", "f", "1", "|", "'", "`", "."]);
const WIDE_CHARS = new Set(["m", "M", "w", "W", "@", "#", "%", "&", "0", "8", "Q", "G", "O"]);

function estimateCharWidth(character: string) {
  if (character === " ") return 0.35;
  if (NARROW_CHARS.has(character)) return 0.6;
  if (WIDE_CHARS.has(character)) return 1.3;
  if (/[/\\()[\]{}]/.test(character)) return 0.8;
  return 1;
}

function getBalancedPivotIndex(characters: string[], candidateIndices: number[]) {
  if (!candidateIndices.length) return 0;

  const cumulativeWidths: number[] = [0];
  for (const character of characters) {
    const previousWidth = cumulativeWidths[cumulativeWidths.length - 1] ?? 0;
    cumulativeWidths.push(previousWidth + estimateCharWidth(character));
  }

  const totalWidth = cumulativeWidths[cumulativeWidths.length - 1] ?? 0;
  let bestIndex = candidateIndices[0] ?? 0;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const index of candidateIndices) {
    const characterWidth = estimateCharWidth(characters[index] || "");
    const leftWidth = (cumulativeWidths[index] ?? 0) + characterWidth / 2;
    const rightWidth =
      totalWidth - (cumulativeWidths[index + 1] ?? totalWidth) + characterWidth / 2;
    const score = Math.abs(leftWidth - rightWidth);

    if (score < bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function splitIntoWords(text: string) {
  return text
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function getPivotIndexForLength(length: number) {
  if (length <= 1) return 0;
  if (length <= 5) return 1;
  if (length <= 9) return 2;
  if (length <= 13) return 3;
  return 4;
}

function createSpeedReaderWord(rawWord: string): SpeedReaderWord {
  const characters = Array.from(rawWord);
  if (!characters.length) {
    return { raw: rawWord, left: "", pivot: "", right: "" };
  }

  let firstCoreIndex = -1;
  let lastCoreIndex = -1;
  const coreIndices: number[] = [];

  characters.forEach((character, index) => {
    if (!WORD_CHARACTER_REGEX.test(character)) return;
    if (firstCoreIndex === -1) firstCoreIndex = index;
    lastCoreIndex = index;
    coreIndices.push(index);
  });

  if (firstCoreIndex === -1 || lastCoreIndex === -1) {
    return {
      raw: rawWord,
      left: "",
      pivot: characters[0] || "",
      right: characters.slice(1).join(""),
    };
  }

  const coreLength = coreIndices.length;
  const isComplexToken = /[^\p{L}\p{N}'’_-]/u.test(rawWord);
  let pivotIndex =
    coreIndices[Math.min(getPivotIndexForLength(coreLength), coreIndices.length - 1)] ?? 0;

  if (coreLength > 13 || isComplexToken) {
    pivotIndex = getBalancedPivotIndex(characters, coreIndices);
  }

  return {
    raw: rawWord,
    left: characters.slice(0, pivotIndex).join(""),
    pivot: characters[pivotIndex] || "",
    right: characters.slice(pivotIndex + 1).join(""),
  };
}

export function buildSpeedReaderWords(text: string) {
  return splitIntoWords(text).map(createSpeedReaderWord);
}

export function getWordDelayMs(word: string, wpm: number) {
  const baseDelay = 60000 / Math.max(wpm, MIN_WPM);
  let multiplier = 1;

  if (word.length >= 9) multiplier += 0.15;
  if (SOFT_STOP_REGEX.test(word)) multiplier += 0.35;
  if (HARD_STOP_REGEX.test(word)) multiplier += 0.7;

  return baseDelay * multiplier;
}
