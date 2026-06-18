"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getTask,
  updateTask,
  deleteTask,
  getLatestAnalysis,
  saveAnalysis,
} from "@/lib/local-store";
import { analyzeTask } from "@/lib/mock-analysis";
import type { Task, AnalysisResult } from "@/types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "待处理", color: "bg-gray-100 text-gray-600" },
  analyzing: { label: "分析中", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "进行中", color: "bg-blue-100 text-blue-700" },
  completed: { label: "已完成", color: "bg-green-100 text-green-800" },
  archived: { label: "已归档", color: "bg-gray-100 text-gray-500" },
};

const RISK_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  low: { label: "低风险", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  medium: { label: "中风险", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  high: { label: "高风险", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  critical: { label: "极高风险", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

function TaskDetailContent() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get("id") || "";

  const [task, setTask] = useState<Task | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [showTemplate, setShowTemplate] = useState(-1);

  useEffect(() => {
    if (!taskId) { setError("缺少任务 ID"); setLoading(false); return; }
    const t = getTask(taskId);
    if (!t) { setError("任务不存在"); setLoading(false); return; }
    setTask(t);
    const latest = getLatestAnalysis(taskId);
    if (latest) setAnalysis(latest.result_json);
    setLoading(false);
  }, [taskId]);

  function handleAnalyze() {
    if (!task) return;
    setAnalyzing(true);
    try {
      const result = analyzeTask(task.task_type, task.title, task.description);
      saveAnalysis(task.id, result);
      setAnalysis(result);
      const updated = getTask(taskId);
      if (updated) setTask(updated);
    } catch (err: any) { alert(err.message || "分析失败"); }
    finally { setAnalyzing(false); }
  }

  function handleDelete() {
    if (!confirm("确定删除这个任务吗？")) return;
    deleteTask(taskId);
    window.location.href = "/tasks";
  }

  // 简化状态机：3步流转
  function handleStatusUpdate(newStatus: Task["status"]) {
    if (!task) return;
    const updated = updateTask(taskId, { status: newStatus });
    if (updated) setTask(updated);
  }

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-gray-400">加载中...</div>;
  if (error || !task) return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center">
      <p className="text-gray-500">{error || "任务不存在"}</p>
      <Link href="/tasks" className="mt-4 inline-block text-sm text-brand-600 hover:underline">返回任务列表</Link>
    </div>
  );

  const statusInfo = STATUS_LABELS[task.status] || STATUS_LABELS.draft;
  const riskInfo = task.risk_level ? RISK_STYLES[task.risk_level] : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/tasks" className="text-sm text-gray-500 hover:text-brand-600 transition-colors">← 返回任务列表</Link>

      {/* Header */}
      <div className="mt-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
          {riskInfo && <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${riskInfo.bg} ${riskInfo.text} ${riskInfo.border}`}>{riskInfo.label}</span>}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
        <p className="mt-1 text-sm text-gray-500">类型: {task.task_type} · 创建于 {new Date(task.created_at).toLocaleString("zh-CN")}</p>
      </div>

      {task.description && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-2 text-sm font-medium text-gray-700">描述</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.description}</p>
        </div>
      )}

      {/* 高风险警告 */}
      {riskInfo && (task.risk_level === "high" || task.risk_level === "critical") && (
        <div className={`mb-6 rounded-xl border-2 p-4 ${riskInfo.bg} ${riskInfo.border}`}>
          <p className={`text-sm font-semibold ${riskInfo.text}`}>⚠️ 此任务风险等级较高，请谨慎处理。AI 分析仅供参考，重大决策请咨询专业人士。</p>
        </div>
      )}

      {/* AI 分析结果 */}
      {analysis ? (
        <div className="mb-6 space-y-4">
          {/* Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">AI 分析结果</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{new Date().toLocaleString("zh-CN")}</span>
                <button onClick={() => copyText(formatAnalysisAsText(analysis), "all")} className="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  {copied === "all" ? "✓ 已复制" : "复制全部"}
                </button>
              </div>
            </div>
            <div className="mb-4 flex items-start gap-3">
              <span className={`mt-0.5 inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                analysis.risk_level === "critical" ? "bg-red-100 text-red-700" :
                analysis.risk_level === "high" ? "bg-orange-100 text-orange-700" :
                analysis.risk_level === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
              }`}>{RISK_STYLES[analysis.risk_level]?.label || analysis.risk_level}</span>
              <p className="flex-1 text-sm font-medium text-gray-900">{analysis.summary}</p>
            </div>

            {analysis.risk_points?.length > 0 && <Section title="⚠️ 风险点" items={analysis.risk_points} color="text-orange-700" />}
            {analysis.key_facts?.length > 0 && <Section title="📋 关键事实" items={analysis.key_facts} color="text-blue-700" />}
            {analysis.suggested_actions?.length > 0 && <Section title="✅ 建议行动" items={analysis.suggested_actions} color="text-green-700" />}
            {analysis.questions_to_verify?.length > 0 && <Section title="❓ 待核实事项" items={analysis.questions_to_verify} color="text-yellow-700" />}

            {analysis.disclaimer && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-500">{analysis.disclaimer}</p></div>
            )}

            <div className="mt-4">
              <button onClick={handleAnalyze} disabled={analyzing} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">
                {analyzing ? "分析中..." : "重新分析"}
              </button>
            </div>
          </div>

          {/* 求助渠道 */}
          {analysis.help_channels?.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-medium text-gray-700">📞 求助渠道</h3>
              <div className="space-y-3">
                {analysis.help_channels.map((ch, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                    <div className="shrink-0">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{ch.contact.slice(0, 2)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{ch.name}</span>
                        {/* 电话号码可点击拨号 */}
                        {/^\d{3,5}$/.test(ch.contact) ? (
                          <a href={`tel:${ch.contact}`} className="rounded bg-brand-50 px-1.5 py-0.5 text-xs font-mono font-medium text-brand-700 hover:bg-brand-100 transition-colors">{ch.contact}</a>
                        ) : (
                          <span className="rounded bg-brand-50 px-1.5 py-0.5 text-xs font-mono font-medium text-brand-700">{ch.contact}</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">{ch.desc}</p>
                      {ch.url && <a href={ch.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-brand-600 hover:underline">访问官网 →</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 维权材料模板 */}
          {analysis.templates?.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-medium text-gray-700">📝 维权材料模板</h3>
              <div className="space-y-2">
                {analysis.templates.map((tpl, i) => (
                  <div key={i}>
                    <button
                      onClick={() => setShowTemplate(showTemplate === i ? -1 : i)}
                      className="flex w-full items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 text-left hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900">{tpl.title}</span>
                      <span className="text-xs text-gray-400">{showTemplate === i ? "收起" : "展开"}</span>
                    </button>
                    {showTemplate === i && (
                      <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4">
                        <pre className="whitespace-pre-wrap text-xs text-gray-700 font-sans leading-relaxed">{tpl.content}</pre>
                        <button onClick={() => copyText(tpl.content, `tpl-${i}`)} className="mt-3 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors">
                          {copied === `tpl-${i}` ? "✓ 已复制" : "一键复制"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 相似案例 */}
          {analysis.similar_cases?.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-medium text-gray-700">🔍 相似诈骗案例</h3>
              <div className="space-y-3">
                {analysis.similar_cases.map((c, i) => (
                  <div key={i} className="rounded-lg border-l-4 border-orange-300 bg-orange-50/50 p-3">
                    <h4 className="text-sm font-semibold text-gray-900">{c.title}</h4>
                    <p className="mt-1 text-xs text-gray-600">套路：{c.pattern}</p>
                    {c.steps && c.steps.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-semibold text-orange-700">套路拆解：</p>
                        {c.steps.map((step, j) => (
                          <p key={j} className="text-xs text-gray-600 pl-2">{step}</p>
                        ))}
                      </div>
                    )}
                    <p className="mt-1 text-xs font-medium text-orange-700">防范：{c.advice}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6 rounded-xl border-2 border-dashed border-gray-200 bg-white p-6 text-center">
          <p className="mb-4 text-sm text-gray-500">还没有 AI 分析结果</p>
          <button onClick={handleAnalyze} disabled={analyzing} className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">
            {analyzing ? "分析中..." : "🤖 让 AI 分析"}
          </button>
        </div>
      )}

      {/* 简化状态机：3步 */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-medium text-gray-700">状态</h3>
        <div className="flex flex-wrap gap-2">
          {task.status !== "completed" && task.status !== "archived" && (
            <button onClick={() => handleStatusUpdate("completed")} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">标记完成</button>
          )}
          {task.status === "completed" && (
            <button onClick={() => handleStatusUpdate("archived")} className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 transition-colors">归档</button>
          )}
          <button onClick={handleDelete} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">删除任务</button>
        </div>
      </div>

      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
        <p className="text-xs text-gray-400">⚖️ 本工具 AI 分析结果仅供参考，不构成法律、金融或医疗建议。涉及重大决策请咨询专业人士。</p>
      </div>
    </div>
  );
}

export default function TaskDetailPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-12 text-center text-gray-400">加载中...</div>}>
      <TaskDetailContent />
    </Suspense>
  );
}

function Section({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className="mb-3">
      <h4 className={`mb-1.5 text-xs font-semibold ${color}`}>{title}</h4>
      <ul className="space-y-1">{items.map((p, i) => <li key={i} className="text-sm text-gray-600 pl-3 border-l-2 border-gray-100">{p}</li>)}</ul>
    </div>
  );
}

function formatAnalysisAsText(a: AnalysisResult): string {
  const lines: string[] = [];
  lines.push(`【风险等级】${a.risk_level}`);
  lines.push(`【总结】${a.summary}`);
  if (a.risk_points?.length) { lines.push("【风险点】"); a.risk_points.forEach((p) => lines.push(`  - ${p}`)); }
  if (a.key_facts?.length) { lines.push("【关键事实】"); a.key_facts.forEach((p) => lines.push(`  - ${p}`)); }
  if (a.suggested_actions?.length) { lines.push("【建议行动】"); a.suggested_actions.forEach((p) => lines.push(`  - ${p}`)); }
  if (a.questions_to_verify?.length) { lines.push("【待核实事项】"); a.questions_to_verify.forEach((p) => lines.push(`  - ${p}`)); }
  if (a.help_channels?.length) { lines.push("【求助渠道】"); a.help_channels.forEach((c) => lines.push(`  - ${c.name}：${c.contact}（${c.desc}）`)); }
  if (a.disclaimer) lines.push(`【免责声明】${a.disclaimer}`);
  return lines.join("\n");
}
