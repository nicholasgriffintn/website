export function truncateWithEllipsis(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;
}

export function truncateOptional(value: string | undefined, maxLength: number) {
  if (!value) {
    return undefined;
  }

  return truncateWithEllipsis(value, maxLength);
}
