"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createTask } from "@/lib/local-store";
import { analyzeTask } from "@/lib/mock-analysis";
import { saveAnalysis } from "@/lib/local-store";

const TASK_TYPES = [
  { value: "scam_check", label: "🔍 这是不是坑？", desc: "判断短信、广告、兼职是否诈骗", gradient: "from-red-500 to-orange-500" },
  { value: "refund_request", label: "💰 退款/投诉/取消", desc: "生成投诉信、退款申请、客服话术", gradient: "from-amber-500 to-yellow-500" },
  { value: "document_review", label: "📄 看懂文件", desc: "提取关键信息、标注风险条款", gradient: "from-blue-500 to-cyan-500" },
  { value: "general_life_issue", label: "📋 其他生活问题", desc: "描述你的问题，AI 帮你分析", gradient: "from-slate-500 to-slate-600" },
];

function NewTaskForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = TASK_TYPES.find((t) => searchParams.has(t.value))?.value || "";
  const [taskType, setTaskType] = useState(preselected);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!taskType) { setError("请选择任务类型"); return; }
    setError(""); setLoading(true);
    try {
      const taskTitle = title || "新任务";
      const task = createTask({ title: taskTitle, task_type: taskType, description });
      const result = analyzeTask(taskType, taskTitle, description);
      saveAnalysis(task.id, result);
      router.push(`/tasks/detail?id=${task.id}`);
    } catch (err: any) { setError(err.message || "创建失败"); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-100">{error}</div>}
      <div>
        <label className="mb-3 block text-sm font-medium text-slate-700">选择类型</label>
        <div className="grid gap-4 sm:grid-cols-2">
          {TASK_TYPES.map((t) => (
            <button key={t.value} type="button" onClick={() => setTaskType(t.value)}
              className={`rounded-2xl border-2 p-5 text-left transition-all ${taskType === t.value ? "border-brand-400 bg-brand-50 shadow-lg shadow-brand-500/10" : "border-slate-100 bg-white hover:border-slate-200"}`}>
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${t.gradient} text-xl text-white shadow-lg`}>{t.label.split(" ")[0]}</div>
              <div className="text-base font-bold text-slate-800">{t.label}</div>
              <div className="mt-1 text-xs text-slate-500">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-slate-700">标题</label>
        <input id="title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder={taskType === "scam_check" ? "例如：收到中奖短信要我转账" : taskType === "refund_request" ? "例如：淘宝买了手机卖家不发货" : taskType === "document_review" ? "例如：租房合同看不懂" : "简短描述你的问题"}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all" />
      </div>
      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700">详细描述</label>
        <textarea id="description" rows={5} value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="把情况详细说一下，比如：收到什么短信、买了什么东西、遇到了什么问题..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all resize-none" />
      </div>
      <button type="submit" disabled={loading || !taskType} className="btn-primary w-full rounded-xl py-3.5 text-sm font-semibold shadow-lg shadow-brand-500/25 disabled:opacity-50">
        {loading ? "创建并分析中..." : "创建任务并让 AI 分析"}
      </button>
    </form>
  );
}

export default function NewTaskPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/tasks" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">← 返回任务列表</Link>
      <div className="mt-4 mb-8"><h1 className="text-3xl font-bold text-slate-900">新建任务</h1><p className="mt-1 text-sm text-slate-500">选择类型，描述你的问题，AI 立即帮你分析</p></div>
      <Suspense fallback={<div className="text-sm text-slate-400">加载中...</div>}><NewTaskForm /></Suspense>
    </div>
  );
}
