import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  emoji?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
  /** 是否带入场动画 */
  animate?: boolean;
}

/** 统一的页面标题区：返回链接 + 标题 + 副标题 + 右侧操作 */
export function PageHeader({
  title,
  subtitle,
  emoji,
  backHref,
  backLabel = "返回",
  actions,
  className,
  animate = true,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-3", animate && "animate-fade-in", className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> {backLabel}
        </Link>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-fg-primary leading-tight">
            {emoji && <span className="mr-2">{emoji}</span>}
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-fg-muted">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
