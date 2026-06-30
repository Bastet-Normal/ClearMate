"use client";

import { PackageSearch, FolderOpen, WifiOff, ShieldOff, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type EmptyPreset = "no-tasks" | "no-results" | "not-logged-in" | "load-failed" | "no-data";

interface EmptyStateProps {
  preset?: EmptyPreset;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: "primary" | "secondary";
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  compact?: boolean;
}

const PRESETS: Record<EmptyPreset, { icon: React.ReactNode; title: string; description: string }> = {
  "no-tasks": {
    icon: <FolderOpen className="h-10 w-10 text-fg-faint" />,
    title: "还没有任务",
    description: "提交您的第一个维权请求，AI 将帮助您分析风险并生成行动方案。",
  },
  "no-results": {
    icon: <PackageSearch className="h-10 w-10 text-fg-faint" />,
    title: "没有找到匹配内容",
    description: "尝试调整筛选条件或搜索关键词。",
  },
  "not-logged-in": {
    icon: <ShieldOff className="h-10 w-10 text-fg-faint" />,
    title: "请先登录",
    description: "登录后即可查看您的任务和分析历史，数据安全保存在本地。",
  },
  "load-failed": {
    icon: <WifiOff className="h-10 w-10 text-fg-faint" />,
    title: "加载失败",
    description: "数据加载出现问题，请刷新页面后重试。",
  },
  "no-data": {
    icon: <Sparkles className="h-10 w-10 text-fg-faint" />,
    title: "暂无数据",
    description: "完成更多操作后，这里将展示相关数据。",
  },
};

export function EmptyState({
  preset,
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  const base = preset ? PRESETS[preset] : null;
  const displayIcon   = icon        ?? base?.icon;
  const displayTitle  = title       ?? base?.title       ?? "暂无内容";
  const displayDesc   = description ?? base?.description ?? "";

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-8 px-4" : "py-16 px-6",
      className
    )}>
      {/* Animated icon container */}
      <div className={cn(
        "flex items-center justify-center rounded-2xl mb-4",
        "bg-surface-2",
        compact ? "h-16 w-16" : "h-20 w-20",
        "animate-float"
      )}>
        {displayIcon}
      </div>

      {/* Text */}
      <h3 className={cn(
        "font-bold text-fg-secondary mb-2",
        compact ? "text-base" : "text-lg"
      )}>
        {displayTitle}
      </h3>
      {displayDesc && (
        <p className={cn(
          "text-fg-muted max-w-sm leading-relaxed",
          compact ? "text-sm" : "text-sm"
        )}>
          {displayDesc}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {action && (
            action.href ? (
              <Link
                href={action.href}
                className={cn(
                  "btn btn-md",
                  action.variant === "secondary" ? "btn-secondary" : "btn-primary"
                )}
              >
                {action.label}
              </Link>
            ) : (
              <button
                onClick={action.onClick}
                className={cn(
                  "btn btn-md",
                  action.variant === "secondary" ? "btn-secondary" : "btn-primary"
                )}
              >
                {action.label}
              </button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Link href={secondaryAction.href} className="btn btn-md btn-ghost text-fg-muted">
                {secondaryAction.label}
              </Link>
            ) : (
              <button onClick={secondaryAction.onClick} className="btn btn-md btn-ghost text-fg-muted">
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
