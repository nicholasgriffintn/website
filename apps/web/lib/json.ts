export function isJsonSerializable(value: unknown): boolean {
  if (typeof value === "undefined") {
    return false;
  }

  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}
