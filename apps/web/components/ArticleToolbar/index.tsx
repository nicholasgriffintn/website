"use client";

import { Headphones, BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BlogPost, Heading } from "@/types/blog";
import type { SpeedReaderController } from "@/components/SpeedReader";
import { TableOfContents } from "@/components/TableOfContents";

import { ListenPanel } from "./ListenPanel";
import { FocusPanel } from "./FocusPanel";

export type ArticleMode = "read" | "listen" | "focus";

interface ArticleToolbarProps {
  post: BlogPost;
  headings: Heading[];
  mode: ArticleMode;
  onModeChange: (mode: ArticleMode) => void;
  speedReaderController: SpeedReaderController;
}

interface ModeButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  position: "left" | "right" | "solo";
}

function ModeButton({ icon, label, active, onClick, position }: ModeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1.5 border px-3 py-2 text-xs font-medium transition-colors",
        position === "left" && "rounded-l-md border-r-0",
        position === "right" && "rounded-r-md",
        position === "solo" && "rounded-md",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function ArticleToolbar({
  post,
  headings,
  mode,
  onModeChange,
  speedReaderController,
}: ArticleToolbarProps) {
  const hasAudio = Boolean(post.audio_url && !post.metadata.hideAudio);
  const hasHeadings = headings.length > 0;

  const toggle = (target: ArticleMode) => {
    onModeChange(mode === target ? "read" : target);
  };

  return (
    <div className="space-y-4">
      <div className="flex w-full">
        {hasAudio && (
          <ModeButton
            icon={<Headphones className="h-3.5 w-3.5" />}
            label="Listen"
            active={mode === "listen"}
            onClick={() => toggle("listen")}
            position="left"
          />
        )}
        <ModeButton
          icon={<BookOpen className="h-3.5 w-3.5" />}
          label="Focus"
          active={mode === "focus"}
          onClick={() => toggle("focus")}
          position={hasAudio ? "right" : "solo"}
        />
      </div>

      {mode === "listen" && hasAudio && (
        <ListenPanel audioUrl={`https://ng-blog.s3rve.co.uk/${post.audio_url}`} />
      )}

      {mode === "focus" && <FocusPanel controller={speedReaderController} />}

      {mode !== "focus" && hasHeadings && <TableOfContents headings={headings} />}
    </div>
  );
}
