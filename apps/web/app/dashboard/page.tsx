"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getStats, getUserTasks, isLoggedIn, logout } from "@/lib/local-store";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ui/confirm";
import type { Task } from "@/types";

const RISK_COLORS: Record<string, string> = { low: "text-green-600 bg-green-50", medium: "text-amber-600 bg-amber-50", high: "text-orange-600 bg-orange-50", critical: "text-red-600 bg-red-50" };
const STATUS_LABELS: Record<string, { label: string; color: string }> = { draft: { label: "待处理", color: "bg-slate-100 text-slate-600" }, analyzing: { label: "分析中", color: "bg-brand-50 text-brand-600" }, in_progress: { label: "进行中", color: "bg-brand-50 text-brand-600" }, completed: { label: "已完成", color: "bg-green-50 text-green-700" }, archived: { label: "已归档", color: "bg-slate-100 text-slate-400" } };

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ReturnType<typeof getStats> | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const confirm2 = useConfirm();

  useEffect(() => { if (!isLoggedIn()) { router.push("/login"); return; } setStats(getStats()); setTasks(getUserTasks().slice(0, 5)); setLoading(false); }, [router]);

  function handleExportData() {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key?.startsWith("cm_")) data[key] = localStorage.getItem(key); }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `clearmate-export-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
  }
  async function handleClearData() {
    const ok1 = await confirm2({ title: "清空数据", message: "确定清空所有数据？此操作不可恢复！", confirmText: "继续", danger: true });
    if (!ok1) return;
    const ok2 = await confirm2({ title: "再次确认", message: "所有任务和分析记录将被永久删除。", confirmText: "确认清空", danger: true });
    if (!ok2) return;
    const keys: string[] = []; for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key?.startsWith("cm_")) keys.push(key); } keys.forEach((k) => localStorage.removeItem(k)); logout(); router.push("/");
  }

  if (loading || !stats) return <div className="mx-auto max-w-6xl px-6 py-12 text-center text-slate-400">加载中...</div>;
  const highRiskTasks = tasks.filter((t) => t.risk_level === "high" || t.risk_level === "critical");

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-10"><h1 className="text-3xl font-bold text-slate-900">你好，{stats.nickname} 👋</h1><p className="mt-1 text-sm text-slate-500">这是你的生活事务全景</p></div>

      <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="总任务" value={stats.totalTasks} icon="📋" gradient="from-blue-500 to-indigo-500" />
        <StatCard label="待处理" value={stats.pendingTasks} icon="⏰" gradient="from-amber-500 to-orange-500" />
        <StatCard label="高风险" value={stats.highRiskTasks} icon="⚠️" gradient="from-red-500 to-rose-500" />
        <StatCard label="已完成" value={stats.completedTasks} icon="✅" gradient="from-green-500 to-emerald-500" />
        <StatCard label="近7天新增" value={stats.recentTasks} icon="📈" gradient="from-violet-500 to-purple-500" />
      </div>

      {highRiskTasks.length > 0 && (
        <div className="mb-10 rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-6">
          <h3 className="mb-4 text-sm font-bold text-red-700">⚠️ 高风险任务需关注</h3>
          <div className="space-y-2">{highRiskTasks.map((task) => (
            <Link key={task.id} href={`/tasks/detail?id=${task.id}`} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${RISK_COLORS[task.risk_level!]}`}>{task.risk_level === "critical" ? "极高" : "高"}风险</span><span className="text-sm font-semibold text-slate-800">{task.title}</span></div>
              <span className="text-xs text-slate-400">查看 →</span>
            </Link>
          ))}</div>
        </div>
      )}

      <div className="mb-10">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">最近任务</h2><Link href="/tasks" className="text-sm font-semibold text-brand-600 hover:text-brand-700">查看全部 →</Link></div>
        {tasks.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center"><div className="mb-4 text-5xl">📋</div><h3 className="mb-2 text-lg font-bold text-slate-800">还没有任务</h3><Link href="/" className="btn-primary inline-flex rounded-xl px-6 py-3 text-sm font-semibold shadow-lg shadow-brand-500/25">开始第一个任务</Link></div>
        ) : (
          <div className="space-y-3">{tasks.map((task) => { const s = STATUS_LABELS[task.status] || STATUS_LABELS.draft; return (
            <Link key={task.id} href={`/tasks/detail?id=${task.id}`} className="card-hover flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-2"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color}`}>{s.label}</span>{task.risk_level && <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${RISK_COLORS[task.risk_level]}`}>{task.risk_level}</span>}</div><h3 className="text-sm font-semibold text-slate-800 truncate">{task.title}</h3><p className="mt-1 text-xs text-slate-400">{new Date(task.created_at).toLocaleString("zh-CN")}</p></div>
            </Link>); })}</div>
        )}
      </div>

      <div className="mb-10">
        <h2 className="mb-5 text-xl font-bold text-slate-900">快速开始</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <QuickLink href="/tasks/new?scam_check" icon="🔍" title="这是不是坑？" desc="判断短信、广告、兼职" gradient="from-red-500 to-orange-500" />
          <QuickLink href="/tasks/new?refund_request" icon="💰" title="退款/投诉" desc="生成维权材料" gradient="from-amber-500 to-yellow-500" />
          <QuickLink href="/tasks/new?document_review" icon="📄" title="看懂文件" desc="提取关键信息" gradient="from-blue-500 to-cyan-500" />
          <QuickLink href="/self-check" icon="🛡️" title="风险自检" desc="快速评估" gradient="from-violet-500 to-purple-500" />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={handleExportData} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm">📥 导出数据</button>
        <button onClick={handleClearData} className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-all shadow-sm">🗑️ 清空数据</button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, gradient }: { label: string; value: number; icon: string; gradient: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3"><span className="text-sm font-medium text-slate-500">{label}</span><span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-lg text-white shadow-lg`}>{icon}</span></div>
      <p className="text-4xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function QuickLink({ href, icon, title, desc, gradient }: { href: string; icon: string; title: string; desc: string; gradient: string }) {
  return (
    <Link href={href} className="card-hover group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-xl text-white shadow-lg`}>{icon}</div>
      <h3 className="mb-1 text-sm font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{title}</h3>
      <p className="text-xs text-slate-500">{desc}</p>
    </Link>
  );
}
