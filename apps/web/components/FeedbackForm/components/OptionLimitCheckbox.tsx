import type { OptionLimitCheckboxProps } from "@/components/FeedbackForm/types";
import { cn } from "@/lib/utils";

export function OptionLimitCheckbox({
  id,
  name,
  option,
  selectedCount,
  checked,
  disabled = false,
  onToggle,
}: OptionLimitCheckboxProps) {
  const shouldDisable = !checked && (disabled || selectedCount >= 2);

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm",
        shouldDisable && "opacity-50",
      )}
    >
      <input
        id={id}
        type="checkbox"
        name={name}
        value={option}
        checked={checked}
        onChange={(event) => onToggle(option, event.currentTarget.checked)}
        disabled={shouldDisable}
        className="h-4 w-4 accent-foreground"
      />
      <span>{option}</span>
    </label>
  );
}
