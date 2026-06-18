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
import { analyzeWithProgress } from "@/lib/analyze-progress";
import { getStoredUser } from "@/lib/local-store";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import type { Task, AnalysisResult } from "@/types";

const TASK_TYPE_LABELS: Record<string, string> = { scam_check: "🔍 这是不是坑？", refund_request: "💰 退款/投诉", complaint: "💰 投诉", subscription_cancel: "💰 取消订阅", document_review: "📄 看懂文件", bill_check: "📄 账单检查", shopping_risk: "🔍 购物风险", general_life_issue: "📋 其他" };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "待处理", color: "bg-slate-100 text-slate-600" },
  analyzing: { label: "分析中", color: "bg-brand-50 text-brand-600" },
  in_progress: { label: "进行中", color: "bg-brand-50 text-brand-600" },
  completed: { label: "已完成", color: "bg-green-50 text-green-700" },
  archived: { label: "已归档", color: "bg-slate-100 text-slate-400" },
};

const RISK_STYLES: Record<string, { label: string; bg: string; text: string; border: string; ring: string }> = {
  low: { label: "低风险", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", ring: "ring-green-500/10" },
  medium: { label: "中风险", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", ring: "ring-amber-500/10" },
  high: { label: "高风险", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", ring: "ring-orange-500/10" },
  critical: { label: "极高风险", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", ring: "ring-red-500/10" },
};

const RISK_PILL: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

function TaskDetailContent() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get("id") || "";

  const [task, setTask] = useState<Task | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisTime, setAnalysisTime] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState("");
  const [analyzeProgressPct, setAnalyzeProgressPct] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [showTemplate, setShowTemplate] = useState(-1);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const { showToast } = useToast();
  const confirm2 = useConfirm();
  const [elderAlertDismissed, setElderAlertDismissed] = useState(false);

  useEffect(() => {
    if (!taskId) { setError("缺少任务 ID"); setLoading(false); return; }
    const t = getTask(taskId);
    if (!t) { setError("任务不存在"); setLoading(false); return; }
    setTask(t);
    const latest = getLatestAnalysis(taskId);
    if (latest) { setAnalysis(latest.result_json); setAnalysisTime(latest.created_at); }
    setLoading(false);
  }, [taskId]);

  async function handleAnalyze() {
    if (!task) return;
    setAnalyzing(true);
    setAnalyzeProgress("");
    setAnalyzeProgressPct(0);
    try {
      const result = await analyzeWithProgress(
        () => analyzeTask(task.task_type, task.title, task.description),
        task.task_type,
        (step, pct) => { setAnalyzeProgress(step); setAnalyzeProgressPct(pct); }
      );
      saveAnalysis(task.id, result);
      setAnalysis(result);
      setAnalysisTime(new Date().toISOString());
      const updated = getTask(taskId);
      if (updated) setTask(updated);
    } catch (err: any) { showToast(err.message || "分析失败", "error"); }
    finally { setAnalyzing(false); }
  }

  async function handleDelete() {
    const ok = await confirm2({ title: "删除任务", message: "确定删除这个任务吗？此操作不可恢复。", confirmText: "删除", danger: true });
    if (!ok) return;
    deleteTask(taskId);
    window.location.href = "/tasks";
  }

  function handleStatusUpdate(newStatus: Task["status"]) {
    if (!task) return;
    const updated = updateTask(taskId, { status: newStatus });
    if (updated) setTask(updated);
  }

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    showToast("已复制到剪贴板");
    setTimeout(() => setCopied(""), 2000);
  }

  // 模板占位符自动填充
  function fillTemplatePlaceholders(content: string): string {
    const user = getStoredUser();
    if (!user) return content;
    return content
      .replace(/\[你的姓名\]/g, user.nickname || "[你的姓名]")
      .replace(/\[手机号\]/g, user.email ? `[手机号]` : "[手机号]");
  }

  function startEditing() {
    if (!task) return;
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditing(true);
  }

  async function saveEdit() {
    if (!task) return;
    const titleChanged = editTitle !== task.title;
    const descChanged = editDesc !== task.description;
    const updated = updateTask(taskId, { title: editTitle, description: editDesc });
    if (updated) setTask(updated);
    setEditing(false);
    // 描述或标题变更时提示重新分析
    if ((titleChanged || descChanged) && analysis) {
      const ok = await confirm2({ title: "重新分析", message: "内容已变更，是否让 AI 重新分析？", confirmText: "重新分析" });
      if (ok) {
        handleAnalyze();
      }
    }
  }

  function cancelEdit() {
    setEditing(false);
  }

  if (loading) return <div className="mx-auto max-w-3xl px-6 py-16 text-center text-slate-400">加载中...</div>;
  if (error || !task) return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <div className="mb-4 text-5xl">😕</div>
      <p className="text-slate-500">{error || "任务不存在"}</p>
      <Link href="/tasks" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700">返回任务列表 →</Link>
    </div>
  );

  const statusInfo = STATUS_LABELS[task.status] || STATUS_LABELS.draft;
  const riskInfo = task.risk_level ? RISK_STYLES[task.risk_level] : null;
  const isElderMode = typeof window !== "undefined" && localStorage.getItem("cm_elder_mode") === "elder";
  const isHighRisk = task.risk_level === "high" || task.risk_level === "critical";
  const showElderAlert = isElderMode && isHighRisk && !elderAlertDismissed;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/tasks" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">← 返回任务列表</Link>

      {/* 老人模式高风险弹窗 */}
      {showElderAlert && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border-4 border-red-400 bg-white p-8 shadow-2xl text-center">
            <div className="mb-4 text-6xl">🚨</div>
            <h2 className="mb-3 text-2xl font-bold text-red-700">高风险提醒</h2>
            <p className="mb-2 text-lg text-red-600 font-semibold">此任务风险等级为<strong>{task.risk_level === "critical" ? "极高" : "高"}风险</strong></p>
            <p className="mb-6 text-base text-slate-600">请务必谨慎处理，不要轻易转账或提供个人信息。如有疑问，请先咨询家人或拨打 <a href="tel:96110" className="font-bold text-red-700 underline">96110</a>。</p>
            <button onClick={() => setElderAlertDismissed(true)}
              className="w-full rounded-xl bg-red-600 px-8 py-4 text-lg font-bold text-white hover:bg-red-700 transition-colors shadow-lg">
              我知道了，继续查看
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mt-6 mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
          {riskInfo && <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${riskInfo.bg} ${riskInfo.text} ${riskInfo.border}`}>{riskInfo.label}</span>}
        </div>
        {editing ? (
          <div className="space-y-3">
            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-xl border border-brand-300 bg-white px-4 py-3 text-2xl font-bold text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10" />
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={6}
              className="w-full rounded-xl border border-brand-300 bg-white px-4 py-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 resize-none" />
            <div className="flex gap-3">
              <button onClick={saveEdit} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg shadow-brand-500/25">保存修改</button>
              <button onClick={cancelEdit} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">取消</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-slate-900">{task.title}</h1>
              <button onClick={startEditing} className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-brand-600 hover:border-brand-300 transition-all shadow-sm" title="编辑">
                ✏️ 编辑
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">{TASK_TYPE_LABELS[task.task_type] || task.task_type} · 创建于 {new Date(task.created_at).toLocaleString("zh-CN")}{task.updated_at !== task.created_at && ` · 更新于 ${new Date(task.updated_at).toLocaleString("zh-CN")}`}</p>
          </>
        )}
      </div>

      {/* Description — 非编辑模式显示 */}
      {!editing && task.description && (
        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">描述</h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{task.description}</p>
        </div>
      )}

      {/* High Risk Warning */}
      {riskInfo && (task.risk_level === "high" || task.risk_level === "critical") && (
        <div className={`mb-6 rounded-2xl border-2 p-5 risk-high-alert ${riskInfo.bg} ${riskInfo.border}`}>
          <p className={`text-sm font-semibold ${riskInfo.text}`}>⚠️ 此任务风险等级较高，请谨慎处理。AI 分析仅供参考，重大决策请咨询专业人士。</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => {
              const text = `【ClearMate 风险提醒】\n任务：${task.title}\n风险等级：${task.risk_level === "critical" ? "极高" : "高"}风险\n${analysis?.summary || "请帮我看看这个是不是坑"}`;
              if (navigator.share) { navigator.share({ title: "ClearMate 风险提醒", text }); }
              else { navigator.clipboard.writeText(text); showToast("已复制，发给家人确认"); }
            }} className="rounded-xl bg-white/80 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-white transition-all shadow-sm border border-red-200">
              👨‍👩‍👧 发给家人确认
            </button>
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {analyzing && (
        <div className="mb-6 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-indigo-50 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <span className="text-sm font-semibold text-brand-700">{analyzeProgress}</span>
          </div>
          <div className="h-2 rounded-full bg-brand-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500" style={{ width: `${Math.round(analyzeProgressPct * 100)}%` }} />
          </div>
        </div>
      )}
      {!analyzing && analysis ? (
        <div className="mb-6 space-y-4">
          {/* Summary Card */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">🤖 AI 分析结果</h3>
              <div className="flex items-center gap-3">
                {analysisTime && <span className="text-xs text-slate-400">{new Date(analysisTime).toLocaleString("zh-CN")}</span>}
                <button onClick={() => copyText(formatAnalysisAsText(analysis), "all")}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                  {copied === "all" ? "✓ 已复制" : "📋 复制全部"}
                </button>
              </div>
            </div>

            {/* Risk + Summary */}
            <div className="mb-5 flex items-start gap-3">
              <span className={`mt-0.5 inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-bold ${RISK_PILL[analysis.risk_level] || "bg-slate-100 text-slate-600"}`}>
                {{ low: "低风险", medium: "中风险", high: "高风险", critical: "极高风险" }[analysis.risk_level] || analysis.risk_level}
              </span>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Risk Points */}
            {analysis.risk_points?.length > 0 && <Section title="⚠️ 风险点" items={analysis.risk_points} color="text-orange-600" borderColor="border-orange-200" />}
            {/* Key Facts */}
            {analysis.key_facts?.length > 0 && <Section title="📋 关键事实" items={analysis.key_facts} color="text-blue-600" borderColor="border-blue-200" />}
            {/* Suggested Actions */}
            {analysis.suggested_actions?.length > 0 && <Section title="✅ 建议行动" items={analysis.suggested_actions} color="text-green-600" borderColor="border-green-200" />}
            {/* Questions */}
            {analysis.questions_to_verify?.length > 0 && <Section title="❓ 待核实事项" items={analysis.questions_to_verify} color="text-amber-600" borderColor="border-amber-200" />}
            {/* Evidence Checklist */}
            {analysis.evidence_checklist?.length > 0 && <Section title="📸 取证清单" items={analysis.evidence_checklist} color="text-blue-600" borderColor="border-blue-200" />}
            {/* Counter Scripts */}
            {analysis.counter_scripts?.length > 0 && <Section title="💬 反套路话术" items={analysis.counter_scripts} color="text-green-600" borderColor="border-green-200" />}
            {/* Assumptions */}
            {analysis.assumptions?.length > 0 && <Section title="💡 分析假设" items={analysis.assumptions} color="text-slate-500" borderColor="border-slate-200" />}

            {/* Similar Cases */}
            {analysis.similar_cases?.length > 0 && (
              <div className="mb-3">
                <h4 className="mb-2 text-xs font-semibold text-violet-600">📚 相似案例</h4>
                <div className="space-y-2">
                  {analysis.similar_cases.map((c, i) => (
                    <div key={i} className="rounded-xl bg-violet-50 p-3 border border-violet-100">
                      <p className="text-sm font-semibold text-violet-700">{c.title}</p>
                      <p className="mt-1 text-xs text-violet-600 leading-relaxed">{c.pattern}</p>
                      <p className="mt-1 text-xs text-violet-500 font-medium">💡 {c.advice}</p>
                      {c.steps && c.steps.length > 0 && (
                        <div className="mt-2 pl-3 border-l-2 border-violet-200">
                          <p className="text-xs font-semibold text-violet-600 mb-1">套路步骤：</p>
                          {c.steps.map((s, si) => (
                            <p key={si} className="text-xs text-violet-500 leading-relaxed">{s}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Help Channels */}
            {analysis.help_channels?.length > 0 && (
              <div className="mb-3">
                <h4 className="mb-2 text-xs font-semibold text-brand-600">📞 求助渠道</h4>
                <div className="space-y-2">
                  {analysis.help_channels.map((ch, i) => (
                    <div key={i} className="rounded-xl bg-brand-50 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-brand-700">{ch.name}</span>
                        {/^\d+$/.test(ch.contact) ? (
                          <a href={`tel:${ch.contact}`} className="rounded-lg bg-white px-2 py-0.5 text-xs font-mono font-bold text-brand-600 border border-brand-200 hover:bg-brand-100 transition-colors">{ch.contact}</a>
                        ) : (
                          <span className="rounded-lg bg-white px-2 py-0.5 text-xs font-mono font-bold text-brand-600 border border-brand-200">{ch.contact}</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-brand-500">{ch.desc}</p>
                      {ch.url && <a href={ch.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-brand-600 underline hover:text-brand-700">访问官网 →</a>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.disclaimer && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="text-xs text-slate-400">{analysis.disclaimer}</p>
              </div>
            )}

            <div className="mt-5">
              <button onClick={handleAnalyze} disabled={analyzing}
                className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg shadow-brand-500/25 disabled:opacity-50">
                {analyzing ? "分析中..." : "🔄 重新分析"}
              </button>
            </div>
          </div>

          {/* Scam Step Breakdown */}
          {analysis.scam_steps && analysis.scam_steps.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-slate-800">🎭 诈骗步骤拆解</h3>
              <div className="space-y-4">
                {analysis.scam_steps.map((step, i) => (
                  <div key={i} className="relative pl-8">
                    <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white shadow">
                      {i + 1}
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">{step.step}</p>
                      <p className="mt-1 text-xs text-slate-500">{step.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Templates */}
          {analysis.templates?.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-slate-800">📝 维权模板</h3>
              <div className="space-y-3">
                {analysis.templates.map((tpl, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
                    <button onClick={() => setShowTemplate(showTemplate === i ? -1 : i)}
                      className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors">
                      <span className="text-sm font-semibold text-slate-700">{tpl.title}</span>
                      <svg className={`h-4 w-4 text-slate-400 transition-transform ${showTemplate === i ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showTemplate === i && (
                      <div className="border-t border-slate-100 bg-slate-50 p-4">
                        <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">{fillTemplatePlaceholders(tpl.content)}</pre>
                        <button onClick={() => copyText(fillTemplatePlaceholders(tpl.content), `tpl-${i}`)}
                          className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white transition-all shadow-sm">
                          {copied === `tpl-${i}` ? "✓ 已复制" : "📋 复制模板"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mb-4 text-5xl">🤖</div>
          <p className="mb-5 text-sm text-slate-500">还没有 AI 分析结果</p>
          <button onClick={handleAnalyze} disabled={analyzing}
            className="btn-primary rounded-xl px-6 py-3 text-sm font-semibold shadow-lg shadow-brand-500/25 disabled:opacity-50">
            {analyzing ? "分析中..." : "让 AI 分析"}
          </button>
        </div>
      )}

      {/* Status Actions */}
      <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">操作</h3>
        <div className="flex flex-wrap gap-3">
          {task.status !== "completed" && task.status !== "archived" && (
            <button onClick={() => handleStatusUpdate("completed")}
              className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors shadow-lg shadow-green-500/25">
              ✅ 标记完成
            </button>
          )}
          {task.status === "completed" && (
            <button onClick={() => handleStatusUpdate("archived")}
              className="rounded-xl bg-slate-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-600 transition-colors shadow-sm">
              📦 归档
            </button>
          )}
          <button onClick={handleDelete}
            className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-all shadow-sm">
            🗑️ 删除任务
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
        <p className="text-xs text-slate-400">⚖️ 本工具 AI 分析结果仅供参考，不构成法律、金融或医疗建议。涉及重大决策请咨询专业人士。</p>
      </div>
    </div>
  );
}

export default function TaskDetailPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-6 py-16 text-center text-slate-400">加载中...</div>}>
      <TaskDetailContent />
    </Suspense>
  );
}

function Section({ title, items, color, borderColor }: { title: string; items: string[]; color: string; borderColor: string }) {
  return (
    <div className="mb-4">
      <h4 className={`mb-2 text-xs font-bold ${color}`}>{title}</h4>
      <ul className="space-y-1.5">
        {items.map((p, i) => (
          <li key={i} className="text-sm text-slate-600 pl-4 border-l-2 py-0.5 leading-relaxed" style={{ borderColor: borderColor.includes("orange") ? "#fed7aa" : borderColor.includes("blue") ? "#bfdbfe" : borderColor.includes("green") ? "#bbf7d0" : "#fde68a" }}>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatAnalysisAsText(a: AnalysisResult): string {
  const lines: string[] = [];
  lines.push(`【风险等级】${a.risk_level}`);
  lines.push(`【总结】${a.summary}`);
  if (a.risk_points?.length) { lines.push("【风险点】"); a.risk_points.forEach((p) => lines.push(`  - ${p}`)); }
  if (a.key_facts?.length) { lines.push("【关键事实】"); a.key_facts.forEach((p) => lines.push(`  - ${p}`)); }
  if (a.assumptions?.length) { lines.push("【分析假设】"); a.assumptions.forEach((p) => lines.push(`  - ${p}`)); }
  if (a.suggested_actions?.length) { lines.push("【建议行动】"); a.suggested_actions.forEach((p) => lines.push(`  - ${p}`)); }
  if (a.questions_to_verify?.length) { lines.push("【待核实事项】"); a.questions_to_verify.forEach((p) => lines.push(`  - ${p}`)); }
  if (a.similar_cases?.length) { lines.push("【相似案例】"); a.similar_cases.forEach((c) => { lines.push(`  - ${c.title}: ${c.pattern}`); lines.push(`    建议: ${c.advice}`); }); }
  if (a.help_channels?.length) { lines.push("【求助渠道】"); a.help_channels.forEach((c) => lines.push(`  - ${c.name}：${c.contact}（${c.desc}）`)); }
  if (a.templates?.length) { lines.push("【维权模板】"); a.templates.forEach((t) => { lines.push(`  --- ${t.title} ---`); lines.push(t.content); }); }
  if (a.disclaimer) lines.push(`【免责声明】${a.disclaimer}`);
  return lines.join("\n");
}
