import * as React from "react";
import { cn } from "@/lib/utils";
import { RISK_META } from "@/lib/meta";
import type { RiskLevel } from "@/types";

interface RiskBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  level: RiskLevel;
  /** 紧凑形式：仅显示"极高/高/中/低" */
  short?: boolean;
}

/** 实心渐变风险徽章 */
export function RiskBadge({ level, short = false, className, ...props }: RiskBadgeProps) {
  const meta = RISK_META[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white",
        meta.badge,
        className
      )}
      {...props}
    >
      {short ? meta.shortLabel : meta.label}
    </span>
  );
}

/** 风险圆点 */
export function RiskDot({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 rounded-full shrink-0", RISK_META[level].dot, className)}
    />
  );
}
