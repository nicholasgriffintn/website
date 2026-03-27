export function getNextLimitedSelection(
  selected: string[],
  option: string,
  isChecked: boolean,
  limit = 2,
) {
  if (isChecked) {
    if (selected.length >= limit) {
      return selected;
    }

    return [...selected, option];
  }

  return selected.filter((item) => item !== option);
}
