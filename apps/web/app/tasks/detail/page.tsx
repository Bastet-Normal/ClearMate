"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Volume2, VolumeX, RefreshCw, Archive,
  CheckCircle2, Trash2, Pencil, Save, X as XIcon, Loader2
} from "lucide-react";
import {
  getTask, updateTask, deleteTask, getLatestAnalysis, saveAnalysis,
} from "@/lib/local-store";
import { safeGetItem } from "@/lib/client-storage";
import { useRequireAuth } from "@/lib/use-require-auth";
import { unifiedAnalyze }    from "@/lib/unified-analyze";
import { analyzeWithProgress } from "@/lib/analyze-progress";
import { autoFillTemplate }  from "@/lib/template-filler";
import { useToast }          from "@/components/ui/toast";
import { useConfirm }        from "@/components/ui/confirm";
import { AnalysisResultView } from "@/components/features/analysis-result";
import { ThinkingSteps }     from "@/components/ui/thinking-steps";
import { EmptyState }        from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/ui/risk-badge";
import { cn } from "@/lib/utils";
import { getTypeMeta, getStatusMeta, getProviderMeta, RISK_META } from "@/lib/meta";
import type { Task, AnalysisResult } from "@/types";

const RISK_LEVEL_TEXT: Record<string, string> = { critical: "极高风险", high: "高风险", medium: "中风险", low: "低风险" };
const RISK_SHORT_TEXT: Record<string, string> = { critical: "极高", high: "高", medium: "中", low: "低" };

function formatAnalysisAsText(a: AnalysisResult): string {
  const lines: string[] = [];
  lines.push(`【ClearMate 分析报告】\n`);
  lines.push(`【风险等级】${RISK_LEVEL_TEXT[a.risk_level] ?? a.risk_level}`);
  lines.push(`【总结】${a.summary}`);
  if (a.risk_points?.length)       { lines.push("\n【风险点】"); a.risk_points.forEach(p => lines.push(`  - ${p}`)); }
  if (a.suggested_actions?.length) { lines.push("\n【建议行动】"); a.suggested_actions.forEach((p,i) => lines.push(`  ${i+1}. ${p}`)); }
  if (a.help_channels?.length)     { lines.push("\n【求助渠道】"); a.help_channels.forEach(c => lines.push(`  - ${c.name}：${c.contact}`)); }
  if (a.templates?.length)         { lines.push("\n【维权模板】"); a.templates.forEach(t => { lines.push(`\n--- ${t.title} ---`); lines.push(autoFillTemplate(t.content, "")); }); }
  if (a.disclaimer)                lines.push(`\n⚖️ ${a.disclaimer}`);
  return lines.join("\n");
}

function TaskDetailContent() {
  useRequireAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const taskId       = searchParams.get("id") || "";

  const [task,         setTask]         = useState<Task | null>(null);
  const [analysis,     setAnalysis]     = useState<AnalysisResult | null>(null);
  const [analysisTime, setAnalysisTime] = useState("");
  const [provider,     setProvider]     = useState("");
  const [loading,      setLoading]      = useState(true);
  const [analyzing,    setAnalyzing]    = useState(false);
  const [progress,     setProgress]     = useState("");
  const [progressPct,  setProgressPct]  = useState(0);
  const [error,        setError]        = useState("");
  const [editing,      setEditing]      = useState(false);
  const [editTitle,    setEditTitle]    = useState("");
  const [editDesc,     setEditDesc]     = useState("");
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [elderAlert,   setElderAlert]   = useState(false);
  const [isElder,      setIsElder]      = useState(false);
  const { toast }  = useToast();
  const confirm2   = useConfirm();

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  useEffect(() => {
    // 一次性读取老人模式到 state，避免 render 期读 localStorage
    const elderPref = safeGetItem("cm_elder_mode") === "elder";
    setIsElder(elderPref);

    if (!taskId) { setError("缺少任务 ID"); setLoading(false); return; }
    const t = getTask(taskId);
    if (!t)     { setError("任务不存在"); setLoading(false); return; }
    setTask(t);
    const latest = getLatestAnalysis(taskId);
    if (latest) {
      setAnalysis(latest.result_json);
      setAnalysisTime(latest.created_at);
      setProvider(latest.provider || "client-mock");
    }
    setLoading(false);
    if (elderPref && (t.risk_level === "high" || t.risk_level === "critical")) {
      setElderAlert(true);
    }
  }, [taskId]);

  const handleAnalyze = async () => {
    if (!task) return;
    setAnalyzing(true); setProgress(""); setProgressPct(0);
    try {
      const result = await analyzeWithProgress(
        () => unifiedAnalyze(task.task_type, task.title, task.description),
        task.task_type,
        (step, pct) => { setProgress(step); setProgressPct(pct); }
      );
      const prov = result._provider || "client-mock";
      saveAnalysis(task.id, result, prov, result._model || "v1");
      setAnalysis(result); setAnalysisTime(new Date().toISOString()); setProvider(prov);
      if (result._error) toast.error("分析出错", result._error);
      const updated = getTask(taskId);
      if (updated) setTask(updated);
    } catch (err: any) { toast.error("分析失败", err.message); }
    finally { setAnalyzing(false); }
  };

  const handleDelete = async () => {
    const ok = await confirm2({ title: "删除任务", message: "确定删除此任务？操作不可恢复。", confirmText: "删除", danger: true });
    if (!ok) return;
    deleteTask(taskId); router.push("/tasks");
  };

  const handleStatusUpdate = (s: Task["status"]) => {
    const updated = updateTask(taskId, { status: s });
    if (updated) setTask(updated);
  };

  const startEdit = () => { if (!task) return; setEditTitle(task.title); setEditDesc(task.description); setEditing(true); };
  const cancelEdit = () => setEditing(false);
  const saveEdit  = async () => {
    if (!task) return;
    const changed = editTitle !== task.title || editDesc !== task.description;
    const updated = updateTask(taskId, { title: editTitle, description: editDesc });
    if (updated) setTask(updated);
    setEditing(false);
    if (changed && analysis) {
      const ok = await confirm2({ title: "重新分析？", message: "内容已修改，是否让 AI 重新分析？", confirmText: "重新分析" });
      if (ok) handleAnalyze();
    }
  };

  const speakReport = () => {
    if (!analysis) return;
    if (!window.speechSynthesis) { toast.error("不支持语音播放"); return; }
    if (isPlaying) { window.speechSynthesis.cancel(); setIsPlaying(false); return; }
    const text = `分析结论：${analysis.summary}。风险等级：${RISK_SHORT_TEXT[analysis.risk_level]}风险。建议行动：${analysis.suggested_actions.slice(0,3).join("，")}。`;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "zh-CN"; utt.rate = isElder ? 0.85 : 1.0;
    utt.onend = utt.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utt); setIsPlaying(true);
  };

  const copyAll = async () => {
    if (!analysis) return;
    await navigator.clipboard.writeText(formatAnalysisAsText(analysis));
    toast.success("已复制全部分析内容");
  };

  if (loading) return (
    <div className="min-h-screen page-bg">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div className="skeleton h-4 w-32" />
        <div className="card rounded-2xl p-6 space-y-3">
          <div className="skeleton h-5 w-24" />
          <div className="skeleton h-7 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
        </div>
      </div>
    </div>
  );

  if (error || !task) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6">
      <span className="text-5xl">😕</span>
      <p className="text-fg-muted">{error || "任务不存在"}</p>
      <Link href="/tasks" className="btn btn-sm btn-secondary">返回任务列表</Link>
    </div>
  );

  const statusInfo  = getStatusMeta(task.status);
  const typeMeta    = getTypeMeta(task.task_type);
  const provMeta    = getProviderMeta(provider);
  const riskMeta    = task.risk_level ? RISK_META[task.risk_level] : null;

  return (
    <div className="min-h-screen page-bg">
      {/* Elder high-risk modal */}
      {elderAlert && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border-4 border-red-400 p-8 shadow-2xl text-center animate-scale-in" style={{ background: "rgb(var(--bg-0))" }}>
            <div className="text-6xl mb-4">🚨</div>
            <h2 className="text-2xl font-black text-red-700 dark:text-red-400 mb-2">高风险提醒</h2>
            <p className="text-base text-fg-secondary mb-2">
              此任务风险等级为 <strong className="text-red-600">{task.risk_level === "critical" ? "极高" : "高"}风险</strong>
            </p>
            <p className="text-sm text-fg-muted mb-6 leading-relaxed">
              请不要轻易转账或提供个人信息。如有疑问，请先询问家人或拨打 <a href="tel:96110" className="font-bold text-red-600 underline">96110</a> 反诈热线。
            </p>
            <button onClick={() => setElderAlert(false)} className="btn btn-lg btn-danger w-full">
              我知道了，继续查看
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 space-y-6">

        {/* Back + breadcrumb */}
        <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-brand-600 dark:hover:text-brand-400 transition-colors animate-fade-in">
          <ChevronLeft className="h-4 w-4" /> 返回任务列表
        </Link>

        {/* Task header card */}
        <div className="card rounded-2xl overflow-hidden animate-fade-in-up">
          {/* Accent bar */}
          {riskMeta && <div className={cn("h-1 w-full", riskMeta.dot)} />}

          <div className="p-5 sm:p-6">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs text-fg-faint">{typeMeta.label}</span>
              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              {task.risk_level && <RiskBadge level={task.risk_level} />}
              {analysis && (
                <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border", provMeta.color)}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" /> {provMeta.label}
                </span>
              )}
            </div>

            {/* Title + edit */}
            {editing ? (
              <div className="space-y-3">
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="input-field text-xl font-bold" />
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={5} className="input-field resize-none text-sm" />
                <div className="flex gap-2">
                  <button onClick={saveEdit}   className="btn btn-sm btn-primary"><Save className="h-3.5 w-3.5" /> 保存</button>
                  <button onClick={cancelEdit} className="btn btn-sm btn-ghost"><XIcon className="h-3.5 w-3.5" /> 取消</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-xl sm:text-2xl font-black text-fg-primary leading-snug">{task.title}</h1>
                  <button onClick={startEdit} className="btn btn-sm btn-ghost shrink-0 text-fg-faint">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-fg-faint">
                  创建于 {new Date(task.created_at).toLocaleString("zh-CN")}
                  {task.updated_at !== task.created_at && ` · 更新于 ${new Date(task.updated_at).toLocaleString("zh-CN")}`}
                </p>
                {task.description && (
                  <p className="mt-3 text-sm text-fg-muted leading-relaxed whitespace-pre-wrap line-clamp-4">{task.description}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Analyze progress */}
        {analyzing && (
          <div className="card rounded-2xl p-5 animate-fade-in">
            <ThinkingSteps currentStep={progress} progress={progressPct} isElder={isElder} />
          </div>
        )}

        {/* Analysis section */}
        {!analyzing && analysis ? (
          <div className="space-y-4 animate-fade-in">
            {/* Header bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-black text-fg-primary flex items-center gap-2">
                🛡️ 维权诊断书
                {analysisTime && (
                  <span className="text-xs font-normal text-fg-faint">
                    · {new Date(analysisTime).toLocaleString("zh-CN", { month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit" })}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={speakReport} className={cn("btn btn-sm", isPlaying ? "btn-danger" : "btn-secondary")}>
                  {isPlaying ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  {isPlaying ? "停止朗读" : "朗读结论"}
                </button>
                <button onClick={handleAnalyze} className="btn btn-sm btn-ghost text-fg-muted">
                  <RefreshCw className="h-3.5 w-3.5" /> 重新分析
                </button>
              </div>
            </div>

            <AnalysisResultView result={analysis} isElder={isElder} />
          </div>
        ) : !analyzing ? (
          <div className="card rounded-2xl animate-fade-in">
            <EmptyState
              icon={<span className="text-4xl">🤖</span>}
              title="还没有 AI 分析结果"
              description="点击下方按钮，让 AI 为您分析此任务，生成风险评估和行动方案。"
              action={{ label: "立即 AI 分析", onClick: handleAnalyze }}
            />
          </div>
        ) : null}

        {/* Status actions */}
        <div className="card rounded-2xl p-5 animate-fade-in">
          <h3 className="text-xs font-bold uppercase tracking-widest text-fg-faint mb-4">任务操作</h3>
          <div className="flex flex-wrap gap-2">
            {task.status !== "completed" && task.status !== "archived" && (
              <button onClick={() => handleStatusUpdate("completed")} className="btn btn-sm btn-secondary text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                <CheckCircle2 className="h-3.5 w-3.5" /> 标记完成
              </button>
            )}
            {task.status === "completed" && (
              <button onClick={() => handleStatusUpdate("archived")} className="btn btn-sm btn-ghost text-fg-muted">
                <Archive className="h-3.5 w-3.5" /> 归档
              </button>
            )}
            {analysis && (
              <button onClick={copyAll} className="btn btn-sm btn-ghost text-fg-muted">
                复制完整报告
              </button>
            )}
            <button onClick={handleDelete} className="btn btn-sm btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 ml-auto">
              <Trash2 className="h-3.5 w-3.5" /> 删除任务
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-fg-faint text-center pb-4">
          ⚖️ AI 分析仅供参考，不构成法律或专业建议。如涉重大决策，请咨询专业人士。
        </p>
      </div>
    </div>
  );
}

export default function TaskDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    }>
      <TaskDetailContent />
    </Suspense>
  );
}
