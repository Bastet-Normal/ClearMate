"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import type { Task } from "@/types";

const TASK_TYPE_LABELS: Record<string, string> = {
  scam_check: "🔍 这是不是坑？",
  refund_request: "💰 退款/投诉/取消",
  complaint: "💰 投诉",
  subscription_cancel: "💰 取消订阅",
  document_review: "📄 看懂文件",
  bill_check: "📄 账单检查",
  shopping_risk: "🔍 购物风险",
  general_life_issue: "📋 其他生活问题",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-600" },
  pending_info: { label: "待补充", color: "bg-yellow-100 text-yellow-700" },
  analyzing: { label: "分析中", color: "bg-blue-100 text-blue-700" },
  waiting_confirmation: { label: "待确认", color: "bg-orange-100 text-orange-700" },
  ready_to_execute: { label: "可执行", color: "bg-green-100 text-green-700" },
  in_progress: { label: "进行中", color: "bg-blue-100 text-blue-700" },
  waiting_response: { label: "等回复", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "已完成", color: "bg-green-100 text-green-800" },
  failed: { label: "失败", color: "bg-red-100 text-red-700" },
  archived: { label: "已归档", color: "bg-gray-100 text-gray-500" },
};

const RISK_COLORS: Record<string, string> = {
  low: "text-green-600",
  medium: "text-yellow-600",
  high: "text-orange-600",
  critical: "text-red-600",
};

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const res = await api.get("/api/v1/tasks");
      setTasks(res.data.items);
      setTotal(res.data.total);
    } catch (err: any) {
      if (err.response?.status === 401) return; // redirected by interceptor
      setError("加载失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(taskId: string) {
    if (!confirm("确定删除这个任务吗？")) return;
    try {
      await api.delete(`/api/v1/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setTotal((prev) => prev - 1);
    } catch {
      alert("删除失败");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-gray-400">
        加载中...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的任务</h1>
          <p className="mt-1 text-sm text-gray-500">
            共 {total} 个任务
          </p>
        </div>
        <Link
          href="/tasks/new"
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          + 新建任务
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {tasks.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="mb-4 text-4xl">📋</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">还没有任务</h3>
          <p className="mb-6 text-sm text-gray-500">
            选择一个入口开始，AI 帮你分析风险、看懂文件、生成维权材料
          </p>
          <Link
            href="/"
            className="inline-flex rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            回到首页
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const statusInfo = STATUS_LABELS[task.status] || STATUS_LABELS.draft;
            return (
              <div
                key={task.id}
                className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">
                        {TASK_TYPE_LABELS[task.task_type] || task.task_type}
                      </span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      {task.risk_level && (
                        <span className={`text-xs font-semibold ${RISK_COLORS[task.risk_level] || ""}`}>
                          风险: {task.risk_level}
                        </span>
                      )}
                    </div>
                    <Link href={`/tasks/${task.id}`} className="block">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
                        {task.title}
                      </h3>
                    </Link>
                    {task.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{task.description}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      创建于 {new Date(task.created_at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="删除"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
