"use client";

import Link from "next/link";
import { ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/ui/risk-badge";
import { getRiskMeta, getStatusMeta, getTypeMeta } from "@/lib/meta";
import type { Task } from "@/types";

interface TaskItemProps {
  task: Task;
  variant?: "default" | "compact";
  onDelete?: (id: string) => void;
  index?: number;
  className?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/** 共享任务行卡片 — dashboard 最近任务 + tasks 列表共用 */
export function TaskItem({ task, variant = "default", onDelete, index = 0, className }: TaskItemProps) {
  const risk = getRiskMeta(task.risk_level);
  const status = getStatusMeta(task.status);
  const type = getTypeMeta(task.task_type);
  const detailHref = `/tasks/detail?id=${task.id}`;
  const compact = variant === "compact";

  return (
    <div
      className={cn(
        "card card-hover group rounded-2xl overflow-hidden animate-stagger-in",
        compact && "rounded-xl",
        className
      )}
      style={{ animationDelay: `${index * 45}ms` }}
    >
      {/* 顶部风险色条 */}
      {risk && !compact && <div className={cn("h-0.5 w-full", risk.dot)} />}

      <div className="flex items-start gap-4 p-4 sm:p-5">
        {/* 风险圆点 */}
        <div className={cn("rounded-full shrink-0 mt-1.5", risk ? risk.dot : "bg-stone-300 dark:bg-stone-600")} style={{ height: 10, width: 10 }} />

        <Link href={detailHref} className="flex-1 min-w-0">
          {/* 徽章行 */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="text-xs text-fg-faint">{type.label}</span>
            <Badge className={status.color}>{status.label}</Badge>
            {risk && <RiskBadge level={task.risk_level!} />}
          </div>

          <h3 className={cn(
            "font-semibold text-fg-primary truncate group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors",
            compact ? "text-sm" : "text-base"
          )}>
            {task.title}
          </h3>

          {!compact && task.description && (
            <p className="mt-1 text-sm text-fg-muted line-clamp-1">{task.description}</p>
          )}

          <p className="mt-1.5 text-xs text-fg-faint">{formatDate(task.created_at)}</p>
        </Link>

        {/* 操作 */}
        <div className="flex items-center gap-1 shrink-0">
          {onDelete && (
            <button
              onClick={(e) => { e.preventDefault(); onDelete(task.id); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-faint hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
              title="删除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <Link
            href={detailHref}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-faint hover:bg-brand-50 dark:hover:bg-brand-950/30 hover:text-brand-500 transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
