"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, SortDesc, Clock } from "lucide-react";
import { getUserTasks, deleteTask } from "@/lib/local-store";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useConfirm } from "@/components/ui/confirm";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskItem } from "@/components/ui/task-item";
import { Select } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { TYPE_LABELS, RISK_ORDER } from "@/lib/meta";
import type { Task } from "@/types";

const TYPE_OPTIONS = [
  { value: "", label: "全部类型" },
  { value: "scam_check", label: TYPE_LABELS.scam_check.label },
  { value: "refund_request", label: TYPE_LABELS.refund_request.label },
  { value: "subscription_cancel", label: TYPE_LABELS.subscription_cancel.label },
  { value: "document_review", label: TYPE_LABELS.document_review.label },
  { value: "general_life_issue", label: TYPE_LABELS.general_life_issue.label },
];

const RISK_OPTIONS = [
  { value: "", label: "全部风险" },
  { value: "critical", label: "🔴 极高风险" },
  { value: "high", label: "🟠 高风险" },
  { value: "medium", label: "🟡 中风险" },
  { value: "low", label: "🟢 低风险" },
];

export default function TasksPage() {
  useRequireAuth();
  const confirm2 = useConfirm();
  const [tasks,      setTasks]      = useState<Task[]>([]);
  const [search,     setSearch]     = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [sortBy,     setSortBy]     = useState<"time" | "risk">("time");

  useEffect(() => { setTasks(getUserTasks()); }, []);

  const sortedFiltered = useMemo(() => {
    let list = tasks.filter(t => {
      if (search     && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType && t.task_type  !== filterType) return false;
      if (filterRisk && t.risk_level !== filterRisk) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sortBy === "risk") {
        const diff = (RISK_ORDER[a.risk_level ?? "low"] ?? 4) - (RISK_ORDER[b.risk_level ?? "low"] ?? 4);
        if (diff !== 0) return diff;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [tasks, search, filterType, filterRisk, sortBy]);

  async function handleDelete(id: string) {
    const ok = await confirm2({ title: "删除任务", message: "确定删除这个任务？此操作不可恢复。", confirmText: "删除", danger: true });
    if (!ok) return;
    deleteTask(id);
    setTasks(getUserTasks());
  }

  return (
    <div className="min-h-screen page-bg">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-fg-primary">我的任务</h1>
            <p className="mt-1 text-sm text-fg-muted">
              共 {sortedFiltered.length} 个{sortedFiltered.length !== tasks.length ? `（筛选自 ${tasks.length}）` : ""}
            </p>
          </div>
          <Link href="/" className="btn btn-md btn-primary">
            <Plus className="h-4 w-4" /> 新建分析
          </Link>
        </div>

        {/* Filter bar */}
        {tasks.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-faint pointer-events-none z-10" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索任务..."
                className="input-field pl-9 py-2 text-sm"
              />
            </div>

            <Select value={filterType} onChange={e => setFilterType(e.target.value)} className="py-2 text-sm w-auto">
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>

            <Select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="py-2 text-sm w-auto">
              {RISK_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>

            <button
              onClick={() => setSortBy(s => s === "time" ? "risk" : "time")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                sortBy === "risk"
                  ? "bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300"
                  : "bg-surface-0 border-border text-fg-muted hover:bg-surface-2"
              )}
            >
              {sortBy === "risk" ? <SortDesc className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
              {sortBy === "risk" ? "按风险" : "按时间"}
            </button>
          </div>
        )}

        {/* List */}
        {tasks.length === 0 ? (
          <div className="card rounded-2xl">
            <EmptyState preset="no-tasks" action={{ label: "开始第一个分析", href: "/" }} />
          </div>
        ) : sortedFiltered.length === 0 ? (
          <div className="card rounded-2xl">
            <EmptyState preset="no-results" action={{ label: "清除筛选", onClick: () => { setSearch(""); setFilterType(""); setFilterRisk(""); } }} />
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedFiltered.map((task, i) => (
              <TaskItem key={task.id} task={task} index={i} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
