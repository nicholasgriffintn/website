import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateMarkdownPreview(markdown: string, maxLength = 320) {
  if (!markdown) {
    return "";
  }

  const trimmed = markdown.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  const preview = trimmed.slice(0, maxLength);
  const paragraphCutoff = preview.lastIndexOf("\n\n");
  const wordCutoff = preview.lastIndexOf(" ");
  const cutoff = paragraphCutoff > 120 ? paragraphCutoff : wordCutoff > 0 ? wordCutoff : maxLength;

  return `${trimmed.slice(0, cutoff).trimEnd()}...`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
