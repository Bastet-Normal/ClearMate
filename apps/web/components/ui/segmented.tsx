"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
  /** 横向滚动（移动端 tabs） */
  scrollable?: boolean;
}

/** 分段控件 — 用于 Tab 切换、分类选择 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  fullWidth = false,
  className,
  scrollable = false,
}: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex gap-1 p-1 rounded-xl bg-surface-2",
        fullWidth && "flex w-full",
        scrollable && "flex w-full overflow-x-auto",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap",
              size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
              fullWidth ? "flex-1" : "",
              active
                ? "bg-surface-0 text-brand-600 dark:text-brand-300 shadow-sm"
                : "text-fg-muted hover:text-fg-primary"
            )}
          >
            {opt.icon}
            {opt.label}
            {opt.badge}
          </button>
        );
      })}
    </div>
  );
}
