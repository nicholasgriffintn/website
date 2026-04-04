export function parsePositiveInteger(
  value: number | string | null | undefined,
): number | undefined {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return undefined;
    const rounded = Math.floor(value);
    return rounded > 0 ? rounded : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  return undefined;
}

export function parsePositiveIntegerInRange(
  value: number | string | null | undefined,
  {
    min = 1,
    max,
    fallback,
  }: {
    min?: number;
    max?: number;
    fallback: number;
  },
): number {
  const parsed = parsePositiveInteger(value);
  if (parsed === undefined) {
    return fallback;
  }

  const lowerBound = Math.max(1, Math.floor(min));
  const withLowerBound = parsed < lowerBound ? lowerBound : parsed;

  if (typeof max !== "number" || !Number.isFinite(max)) {
    return withLowerBound;
  }

  return Math.min(withLowerBound, Math.floor(max));
}
