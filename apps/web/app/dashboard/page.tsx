"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList, Clock, ShieldAlert, CheckCircle2, TrendingUp,
  Download, Trash2, Plus, ChevronRight
} from "lucide-react";
import { getStats, getUserTasks, isLoggedIn, logout } from "@/lib/local-store";
import { clearClearMateData, exportClearMateData } from "@/lib/client-storage";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useConfirm } from "@/components/ui/confirm";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { TaskItem } from "@/components/ui/task-item";
import { RiskBadge } from "@/components/ui/risk-badge";
import { cn } from "@/lib/utils";
import { RISK_META } from "@/lib/meta";
import type { Task } from "@/types";

const STAT_CARDS = [
  { key: "totalTasks",     label: "总任务",   icon: ClipboardList, tone: "brand"   as const },
  { key: "pendingTasks",   label: "待处理",   icon: Clock,         tone: "amber"   as const },
  { key: "highRiskTasks",  label: "高风险",   icon: ShieldAlert,   tone: "red"     as const },
  { key: "completedTasks", label: "已完成",   icon: CheckCircle2,  tone: "emerald" as const },
  { key: "recentTasks",    label: "近7天",    icon: TrendingUp,    tone: "violet"  as const },
];

const QUICK_LINKS = [
  { href: "/tasks/new?type=scam_check",     emoji: "🔍", title: "识别骗局", desc: "短信、广告、兼职" },
  { href: "/tasks/new?type=refund_request", emoji: "💰", title: "退款投诉", desc: "生成维权材料" },
  { href: "/tasks/new?type=document_review", emoji: "📄", title: "看懂文件", desc: "合同、账单分析" },
  { href: "/self-check",                    emoji: "🛡️", title: "风险自检", desc: "个人风险评估" },
];

export default function DashboardPage() {
  const router   = useRouter();
  useRequireAuth();
  const confirm2 = useConfirm();
  const [stats,  setStats]  = useState<ReturnType<typeof getStats> | null>(null);
  const [tasks,  setTasks]  = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) return; // 鉴权跳转由 useRequireAuth 处理
    setStats(getStats());
    setTasks(getUserTasks().slice(0, 6));
    setLoading(false);
  }, [router]);

  const handleExport = useCallback(() => {
    const data = exportClearMateData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `clearmate-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  }, []);

  const handleClear = useCallback(async () => {
    const ok1 = await confirm2({ title: "清空所有数据", message: "这将永久删除所有任务和分析记录，此操作无法撤销。", confirmText: "继续", danger: true });
    if (!ok1) return;
    const ok2 = await confirm2({ title: "最终确认", message: "确定要永久删除全部数据吗？", confirmText: "确认清空", danger: true });
    if (!ok2) return;
    clearClearMateData();
    logout(); router.push("/");
  }, [confirm2, router]);

  if (loading) {
    return (
      <div className="min-h-screen page-bg">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 space-y-8">
          <div className="space-y-3">
            <div className="skeleton h-9 w-64" />
            <div className="skeleton h-4 w-40" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-28" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;
  const highRisk = tasks.filter(t => t.risk_level === "critical" || t.risk_level === "high");

  return (
    <div className="min-h-screen page-bg">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-fg-primary">
              你好，{stats.nickname} 👋
            </h1>
            <p className="mt-1 text-sm text-fg-muted">您的维权事务总览</p>
          </div>
          <Link href="/" className="btn btn-md btn-primary shrink-0 self-start">
            <Plus className="h-4 w-4" /> 新建分析
          </Link>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 stagger-children">
          {STAT_CARDS.map(({ key, label, icon: Icon, tone }) => {
            const value = Number(stats[key as keyof typeof stats]);
            const alert = key === "highRiskTasks" && value > 0;
            return (
              <StatCard
                key={key}
                label={label}
                value={stats[key as keyof typeof stats]}
                icon={<Icon className="h-4 w-4" />}
                tone={tone}
                alert={alert}
                alertText={alert ? "需要关注！" : undefined}
                className="animate-stagger-in"
              />
            );
          })}
        </div>

        {/* ── High Risk Alert ── */}
        {highRisk.length > 0 && (
          <div className="rounded-2xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/20 p-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-bold text-red-800 dark:text-red-300">高风险任务需要您关注</h3>
              <div className="ml-auto animate-radar-ping h-2.5 w-2.5 rounded-full bg-red-500" />
            </div>
            <div className="space-y-2">
              {highRisk.map(task => (
                <Link key={task.id} href={`/tasks/detail?id=${task.id}`} className={cn(
                  "flex items-center justify-between rounded-xl p-3.5",
                  "bg-surface-0 dark:bg-surface-1 border border-red-100 dark:border-red-900/50",
                  "hover:shadow-md hover:border-red-300 dark:hover:border-red-700 transition-all"
                )}>
                  <div className="flex items-center gap-3 min-w-0">
                    <RiskBadge level={task.risk_level!} short />
                    <span className="text-sm font-semibold text-fg-primary truncate">{task.title}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-fg-faint shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* ── Recent Tasks ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-fg-primary">最近任务</h2>
              <Link href="/tasks" className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1 transition-colors">
                全部任务 <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {tasks.length === 0 ? (
              <div className="card rounded-2xl">
                <EmptyState preset="no-tasks" action={{ label: "开始第一个分析", href: "/" }} />
              </div>
            ) : (
              <div className="space-y-2.5">
                {tasks.map((task, i) => (
                  <TaskItem key={task.id} task={task} variant="compact" index={i} />
                ))}
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">
            {/* Quick links */}
            <div>
              <h2 className="text-lg font-bold text-fg-primary mb-3">快速开始</h2>
              <div className="grid grid-cols-2 gap-2.5">
                {QUICK_LINKS.map(({ href, emoji, title, desc }) => (
                  <Link key={href} href={href} className="group card card-hover rounded-xl p-3.5 text-center">
                    <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-lg">
                      {emoji}
                    </div>
                    <p className="text-xs font-bold text-fg-primary group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{title}</p>
                    <p className="text-[10px] text-fg-faint mt-0.5">{desc}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Data ops */}
            <div className="card rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-fg-faint mb-3">数据管理</h3>
              <button onClick={handleExport} className="btn btn-sm btn-secondary w-full justify-start gap-2">
                <Download className="h-3.5 w-3.5" /> 导出全部数据
              </button>
              <button onClick={handleClear} className="btn btn-sm btn-ghost w-full justify-start gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                <Trash2 className="h-3.5 w-3.5" /> 清空所有数据
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
