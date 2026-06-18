"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUserTasks, deleteTask } from "@/lib/local-store";
import type { Task } from "@/types";

const TASK_TYPE_LABELS: Record<string, string> = { scam_check: "🔍 这是不是坑？", refund_request: "💰 退款/投诉", complaint: "💰 投诉", subscription_cancel: "💰 取消订阅", document_review: "📄 看懂文件", bill_check: "📄 账单检查", shopping_risk: "🔍 购物风险", general_life_issue: "📋 其他" };
const STATUS_LABELS: Record<string, { label: string; color: string }> = { draft: { label: "待处理", color: "bg-slate-100 text-slate-600" }, analyzing: { label: "分析中", color: "bg-brand-50 text-brand-600" }, in_progress: { label: "进行中", color: "bg-brand-50 text-brand-600" }, completed: { label: "已完成", color: "bg-green-50 text-green-700" }, archived: { label: "已归档", color: "bg-slate-100 text-slate-400" } };
const RISK_COLORS: Record<string, string> = { low: "text-green-600", medium: "text-amber-600", high: "text-orange-600", critical: "text-red-600" };

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterRisk, setFilterRisk] = useState("");

  useEffect(() => { setTasks(getUserTasks()); setLoading(false); }, []);

  function handleDelete(taskId: string) { if (!confirm("确定删除？")) return; deleteTask(taskId); setTasks(getUserTasks()); }

  const filteredTasks = tasks.filter((t) => { if (search && !t.title.includes(search) && !t.description.includes(search)) return false; if (filterType && t.task_type !== filterType) return false; if (filterRisk && t.risk_level !== filterRisk) return false; return true; });

  if (loading) return <div className="mx-auto max-w-6xl px-6 py-12 text-center text-slate-400">加载中...</div>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-slate-900">我的任务</h1><p className="mt-1 text-sm text-slate-500">共 {filteredTasks.length} 个{filteredTasks.length !== tasks.length ? `（筛选自 ${tasks.length}）` : ""}</p></div>
        <Link href="/tasks/new" className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg shadow-brand-500/25">+ 新建</Link>
      </div>

      {tasks.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索..." className="flex-1 min-w-[200px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 shadow-sm" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none shadow-sm">
            <option value="">全部类型</option><option value="scam_check">🔍 这是不是坑</option><option value="refund_request">💰 退款/投诉</option><option value="document_review">📄 看懂文件</option><option value="general_life_issue">📋 其他</option>
          </select>
          <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none shadow-sm">
            <option value="">全部风险</option><option value="critical">极高</option><option value="high">高</option><option value="medium">中</option><option value="low">低</option>
          </select>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center"><div className="mb-4 text-5xl">📋</div><h3 className="mb-2 text-lg font-bold text-slate-800">还没有任务</h3><p className="mb-6 text-sm text-slate-500">选择一个入口开始</p><Link href="/" className="btn-primary inline-flex rounded-xl px-6 py-3 text-sm font-semibold shadow-lg shadow-brand-500/25">回到首页</Link></div>
      ) : (
        <div className="space-y-3">{filteredTasks.map((task) => { const s = STATUS_LABELS[task.status] || STATUS_LABELS.draft; return (
          <div key={task.id} className="card-hover group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <Link href={`/tasks/detail?id=${task.id}`} className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">{TASK_TYPE_LABELS[task.task_type] || task.task_type}</span>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color}`}>{s.label}</span>
                  {task.risk_level && <span className={`text-xs font-bold ${RISK_COLORS[task.risk_level]}`}>风险: {task.risk_level}</span>}
                </div>
                <h3 className="text-base font-semibold text-slate-800 group-hover:text-brand-600 transition-colors truncate">{task.title}</h3>
                {task.description && <p className="mt-1 text-sm text-slate-500 line-clamp-2">{task.description}</p>}
                <p className="mt-2 text-xs text-slate-400">{new Date(task.created_at).toLocaleString("zh-CN")}</p>
              </Link>
              <button onClick={() => handleDelete(task.id)} className="shrink-0 rounded-xl p-2.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all" title="删除">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>); })}</div>
      )}
    </div>
  );
}
