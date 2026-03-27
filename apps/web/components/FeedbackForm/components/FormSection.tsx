import type { FormSectionProps } from "@/components/FeedbackForm/types";

export function FormSection({ title, action, children }: FormSectionProps) {
  return (
    <section className="space-y-4 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
