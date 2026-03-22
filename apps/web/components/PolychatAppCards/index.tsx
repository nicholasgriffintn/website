import { AudioLines, Braces, FileText, Sparkles, StickyNote } from "lucide-react";

import { LinkCard } from "@/components/LinkCard";
import type { PolychatApp } from "@/lib/data/polychat-apps";

const categoryIconMap = {
  Text: FileText,
  Media: AudioLines,
  Productivity: StickyNote,
  "AI Generation": Sparkles,
  "Code Assistance": Braces,
} as const;

export function PolychatAppCards({ apps }: { apps: PolychatApp[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {apps.map((app) => {
        const Icon = categoryIconMap[app.category];
        const descriptionPrefix = app.featured ? `Featured • ${app.category}` : app.category;

        return (
          <LinkCard
            key={app.title}
            icon={<Icon className="w-6 h-6" />}
            title={app.title}
            description={`${descriptionPrefix} • ${app.description}`}
            href={app.href}
            external
          />
        );
      })}
    </div>
  );
}
