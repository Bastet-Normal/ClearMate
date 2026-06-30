import * as React from "react";
import { cn } from "@/lib/utils";

type StatTone = "brand" | "amber" | "red" | "emerald" | "violet";

const toneMap: Record<StatTone, { icon: string; alert?: string }> = {
  brand:   { icon: "bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-300" },
  amber:   { icon: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300" },
  red:     { icon: "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300" },
  emerald: { icon: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300" },
  violet:  { icon: "bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300" },
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: StatTone;
  alert?: boolean;
  alertText?: string;
  className?: string;
}

/** Dashboard 统计卡 — 暖色柔和图标底，去彩虹渐变 */
export function StatCard({ label, value, icon, tone = "brand", alert, alertText, className }: StatCardProps) {
  return (
    <div className={cn("card rounded-2xl p-4 sm:p-5", alert && "ring-2 ring-red-300 dark:ring-red-700/60", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-fg-muted">{label}</span>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", toneMap[tone].icon)}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-black text-fg-primary tabular-nums">{value}</p>
      {alert && alertText && (
        <p className="text-xs text-red-500 mt-1 font-medium">{alertText}</p>
      )}
    </div>
  );
}
