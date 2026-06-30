"use client";

import * as React from "react";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type SectionColor = "slate" | "brand" | "red" | "emerald" | "amber" | "sky" | "violet";

const colorMap: Record<SectionColor, string> = {
  slate:   "text-fg-muted bg-surface-2",
  brand:   "text-brand-600 dark:text-brand-300 bg-brand-100 dark:bg-brand-900/40",
  red:     "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40",
  emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40",
  amber:   "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40",
  sky:     "text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/40",
  violet:  "text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/40",
};

interface SectionCardProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: SectionColor;
  defaultOpen?: boolean;
  collapsible?: boolean;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** 可折叠区块卡片 — 从 analysis-result 抽离 */
export function SectionCard({
  title,
  icon: Icon,
  color = "slate",
  defaultOpen = true,
  collapsible = true,
  headerExtra,
  children,
  className,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("card rounded-xl overflow-hidden", className)}>
      <div
        className={cn(
          "flex w-full items-center justify-between px-4 py-3 text-left transition-colors",
          collapsible && "cursor-pointer hover:bg-surface-1"
        )}
        onClick={() => collapsible && setOpen(v => !v)}
      >
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", colorMap[color])}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          <span className="font-semibold text-sm text-fg-primary">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {headerExtra}
          {collapsible && (
            open
              ? <ChevronUp className="h-4 w-4 text-fg-faint" />
              : <ChevronDown className="h-4 w-4 text-fg-faint" />
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-border px-4 py-3 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}
