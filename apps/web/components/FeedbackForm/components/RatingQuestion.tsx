import { Label } from "@/components/ui/label";
import { LIKERT_VALUES } from "@/components/FeedbackForm/constants";
import type { RatingQuestionProps } from "@/components/FeedbackForm/types";
import { cn } from "@/lib/utils";

export function RatingQuestion({
  id,
  name,
  label,
  required,
  disabled = false,
}: RatingQuestionProps) {
  return (
    <fieldset
      className={cn("rounded-md border border-border p-3 sm:p-4", disabled && "opacity-60")}
      disabled={disabled}
    >
      <legend className="px-1 text-sm font-medium">{label}</legend>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {LIKERT_VALUES.map((score, index) => {
          const optionId = `${id}-${score}`;
          return (
            <div key={optionId} className="flex flex-col items-center gap-1">
              <input
                id={optionId}
                type="radio"
                name={name}
                value={score}
                required={required && index === 0}
                className="h-4 w-4 accent-foreground"
              />
              <Label htmlFor={optionId} className="cursor-pointer text-xs text-muted-foreground">
                {score}
              </Label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
