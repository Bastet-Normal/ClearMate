"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getStats, getUserTasks, isLoggedIn, logout } from "@/lib/local-store";
import { useRouter } from "next/navigation";
import type { Task } from "@/types";

const RISK_COLORS: Record<string, string> = {
  low: "text-green-600 bg-green-50",
  medium: "text-yellow-600 bg-yellow-50",
  high: "text-orange-600 bg-orange-50",
  critical: "text-red-600 bg-red-50",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "待处理", color: "bg-gray-100 text-gray-600" },
  analyzing: { label: "分析中", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "进行中", color: "bg-blue-100 text-blue-700" },
  completed: { label: "已完成", color: "bg-green-100 text-green-800" },
  archived: { label: "已归档", color: "bg-gray-100 text-gray-500" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ReturnType<typeof getStats> | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    setStats(getStats());
    setTasks(getUserTasks().slice(0, 5)); // 最近 5 个
    setLoading(false);
  }, [router]);

  function handleExportData() {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("cm_")) {
        data[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clearmate-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClearData() {
    if (!confirm("确定清空所有数据？此操作不可恢复！")) return;
    if (!confirm("再次确认：所有任务和分析记录将被永久删除。")) return;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("cm_")) keys.push(key);
    }
    keys.forEach((k) => localStorage.removeItem(k));
    logout();
    router.push("/");
  }

  if (loading || !stats) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-gray-400">加载中...</div>
    );
  }

  // 高风险任务
  const highRiskTasks = tasks.filter(
    (t) => t.risk_level === "high" || t.risk_level === "critical"
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          你好，{stats.nickname} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">这是你的生活事务全景</p>
      </div>

      {/* 统计卡片 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="总任务数"
          value={stats.totalTasks}
          icon="📋"
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          label="待处理"
          value={stats.pendingTasks}
          icon="⏰"
          color="bg-orange-50 text-orange-700"
        />
        <StatCard
          label="高风险"
          value={stats.highRiskTasks}
          icon="⚠️"
          color="bg-red-50 text-red-700"
        />
        <StatCard
          label="已完成"
          value={stats.completedTasks}
          icon="✅"
          color="bg-green-50 text-green-700"
        />
      </div>

      {/* 高风险提醒 */}
      {highRiskTasks.length > 0 && (
        <div className="mb-8 rounded-xl border-2 border-red-200 bg-red-50 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-700">
            ⚠️ 高风险任务需关注
          </h3>
          <div className="space-y-2">
            {highRiskTasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/detail?id=${task.id}`}
                className="flex items-center justify-between rounded-lg bg-white p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${RISK_COLORS[task.risk_level!]}`}>
                    {task.risk_level === "critical" ? "极高" : "高"}风险
                  </span>
                  <span className="text-sm font-medium text-gray-900">{task.title}</span>
                </div>
                <span className="text-xs text-gray-400">查看详情 →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 最近任务 */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">最近任务</h2>
          <Link href="/tasks" className="text-sm text-brand-600 hover:underline">
            查看全部 →
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <div className="mb-4 text-4xl">📋</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">还没有任务</h3>
            <Link
              href="/"
              className="inline-flex rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              开始第一个任务
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const statusInfo = STATUS_LABELS[task.status] || STATUS_LABELS.draft;
              return (
                <Link
                  key={task.id}
                  href={`/tasks/detail?id=`}
                  className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      {task.risk_level && (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${RISK_COLORS[task.risk_level]}`}>
                          {task.risk_level}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
                      {task.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(task.created_at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* 快速入口 */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">快速开始</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <QuickLink
            href="/tasks/new?scam_check"
            icon="🔍"
            title="这是不是坑？"
            desc="判断短信、广告、兼职"
          />
          <QuickLink
            href="/tasks/new?refund_request"
            icon="💰"
            title="退款/投诉/取消"
            desc="生成维权材料"
          />
          <QuickLink
            href="/tasks/new?document_review"
            icon="📄"
            title="看懂文件"
            desc="提取关键信息、标注风险"
          />
          <QuickLink
            href="/self-check"
            icon="🛡️"
            title="风险自检"
            desc="快速评估风险状况"
          />
        </div>
      </div>

      {/* 数据管理 */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">数据管理</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportData}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            📥 导出数据
          </button>
          <button
            onClick={handleClearData}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            🗑️ 清空所有数据
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg ${color}`}>
          {icon}
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border-2 border-gray-200 bg-white p-5 hover:border-brand-300 hover:shadow-md transition-all"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-2xl">
        {icon}
      </div>
      <h3 className="mb-1 text-base font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
        {title}
      </h3>
      <p className="text-xs text-gray-500">{desc}</p>
    </Link>
  );
}
