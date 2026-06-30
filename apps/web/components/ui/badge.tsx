import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "neutral" | "brand" | "success" | "warning" | "danger"
  | "info" | "violet" | "purple" | "sky" | "orange" | "rose" | "emerald" | "amber" | "teal";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-stone-100 dark:bg-stone-700/60 text-stone-600 dark:text-stone-300",
  brand:   "bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300",
  success: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  danger:  "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  info:    "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300",
  violet:  "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
  purple:  "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  sky:     "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300",
  orange:  "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
  rose:    "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
  emerald: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  amber:   "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  teal:    "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  solid?: boolean; // 实心（带渐变的风险徽章等）
  dot?: boolean;
}

export function Badge({
  className,
  variant = "neutral",
  solid = false,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none",
        !solid && variantClasses[variant],
        className
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}
