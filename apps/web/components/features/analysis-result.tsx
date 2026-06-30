"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Copy, Check, Share2,
  ClipboardList, MessageSquare, BookOpen, FileText,
  ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle,
  ExternalLink, Lightbulb, Search, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RiskGauge } from "@/components/ui/risk-gauge";
import { SectionCard } from "@/components/ui/section-card";
import { Segmented } from "@/components/ui/segmented";
import { RISK_META, getProviderMeta } from "@/lib/meta";
import type { AnalysisResult } from "@/types";
import { autoFillTemplate } from "@/lib/template-filler";

interface AnalysisResultViewProps {
  result: AnalysisResult;
  isElder?: boolean;
  className?: string;
  /** 显示引擎来源徽章与降级提示（首页工作台内联结果用） */
  showProvider?: boolean;
}

type TabId = "action" | "script" | "cases";

const TABS = [
  { value: "action" as const, label: "行动指引", icon: <ClipboardList className="h-4 w-4" /> },
  { value: "script" as const, label: "话术/模板", icon: <MessageSquare className="h-4 w-4" /> },
  { value: "cases"  as const, label: "案例参考", icon: <BookOpen className="h-4 w-4" /> },
];

function CopyButton({ text, label = "复制", size = "sm" }: { text: string; label?: string; size?: "sm" | "md" }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "btn btn-ghost flex items-center gap-1.5 transition-all",
        size === "sm" ? "btn-sm text-xs" : "btn-md",
        copied ? "text-emerald-600 dark:text-emerald-400" : "text-fg-muted"
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "已复制" : label}
    </button>
  );
}

export function AnalysisResultView({ result, isElder, className, showProvider }: AnalysisResultViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("action");

  const riskMeta = RISK_META[result.risk_level];
  const provMeta = showProvider ? getProviderMeta(result._provider) : null;
  const templateContext = useMemo(
    () => [
      result.summary,
      ...result.key_facts,
      ...result.risk_points,
      ...result.suggested_actions,
      ...result.evidence_checklist,
      ...result.counter_scripts,
    ].join("\n"),
    [result]
  );

  const handleShare = useCallback(async () => {
    const text = `【ClearMate 风险分析】\n${result.summary}\n\n风险等级：${result.risk_level}\n\n建议操作：\n${result.suggested_actions.slice(0, 3).map((a, i) => `${i + 1}. ${a}`).join("\n")}`;
    if (navigator.share) {
      try { await navigator.share({ title: "ClearMate 风险分析", text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  }, [result]);

  const buildTemplateCopy = () =>
    result.templates.map(t => `【${t.title}】\n${autoFillTemplate(t.content, templateContext)}`).join("\n\n---\n\n");

  return (
    <div className={cn("space-y-5 animate-fade-in", className)}>

      {/* ── 降级提示（AI 调用失败回退本地引擎时）── */}
      {result._error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{result._error}</span>
        </div>
      )}

      {/* ── Risk Summary Card ── */}
      <div className={cn("rounded-2xl overflow-hidden", riskMeta.area)}>
        <div className="flex flex-col sm:flex-row items-center gap-6 p-5 sm:p-6">
          {/* Gauge */}
          <div className="shrink-0">
            <RiskGauge level={result.risk_level} score={riskMeta.score} isElder={isElder} />
          </div>

          {/* Summary text */}
          <div className="flex-1 min-w-0 space-y-3">
            <p className={cn(
              "font-bold leading-relaxed",
              isElder ? "text-lg" : "text-base",
              "text-fg-primary"
            )}>
              {result.summary}
            </p>

            {/* Quick risk points */}
            {result.risk_points.length > 0 && (
              <ul className="space-y-1">
                {result.risk_points.slice(0, isElder ? 3 : 4).map((p, i) => (
                  <li key={i} className={cn("flex items-start gap-2 text-sm text-fg-secondary", isElder && "text-base")}>
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 opacity-70" style={{ color: riskMeta.color }} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Share button */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleShare}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                  "bg-surface-0/70 dark:bg-black/10 backdrop-blur-sm border border-current/20",
                  "hover:bg-surface-0",
                  isElder && "text-base px-5 py-2.5"
                )}
              >
                <Share2 className="h-4 w-4" />
                发送给家人确认
              </button>
              <CopyButton text={result.summary} label="复制摘要" />
              {provMeta && (
                <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border", provMeta.color)}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" /> {provMeta.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-current/10 px-5 py-2.5 flex items-start gap-2 opacity-70">
          <HelpCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <p className="text-xs">{result.disclaimer}</p>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <Segmented
        options={TABS}
        value={activeTab}
        onChange={setActiveTab}
        fullWidth
      />

      {/* ── Tab Content ── */}
      <div className="space-y-3">
        {/* ──── ACTION TAB ──── */}
        {activeTab === "action" && (
          <div className="space-y-3 animate-fade-in">
            {result.key_facts.length > 0 && (
              <SectionCard title="关键事实" icon={Search} color="brand">
                <ul className="space-y-2">
                  {result.key_facts.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-fg-secondary">
                      <span className="step-card-circle flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] mt-0.5">{i + 1}</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {result.suggested_actions.length > 0 && (
              <SectionCard title="建议行动步骤" icon={CheckCircle2} color="emerald"
                headerExtra={<CopyButton text={result.suggested_actions.map((a, i) => `${i + 1}. ${a}`).join("\n")} />}>
                <ol className="space-y-3">
                  {result.suggested_actions.map((a, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="step-card-circle flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs mt-0.5">{i + 1}</span>
                      <span className={cn("text-sm text-fg-secondary leading-relaxed", isElder && "text-base")}>{a}</span>
                    </li>
                  ))}
                </ol>
              </SectionCard>
            )}

            {result.evidence_checklist?.length > 0 && (
              <SectionCard title="取证清单" icon={ClipboardList} color="amber">
                <ul className="space-y-2">
                  {result.evidence_checklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-fg-secondary">
                      <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {result.questions_to_verify?.length > 0 && (
              <SectionCard title="需要核实的事项" icon={HelpCircle} color="slate" defaultOpen={false}>
                <ul className="space-y-2">
                  {result.questions_to_verify.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-fg-muted">
                      <span className="text-fg-faint font-bold shrink-0">?</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {result.help_channels?.length > 0 && (
              <SectionCard title="投诉渠道" icon={Phone} color="brand" defaultOpen={false}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {result.help_channels.map((ch, i) => (
                    <div key={i} className="rounded-lg border border-border bg-surface-1 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-fg-primary">{ch.name}</p>
                        {ch.url ? (
                          <a href={ch.url} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-600">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                      </div>
                      <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-0.5">{ch.contact}</p>
                      <p className="text-xs text-fg-muted mt-1">{ch.desc}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {/* ──── SCRIPT TAB ──── */}
        {activeTab === "script" && (
          <div className="space-y-3 animate-fade-in">
            {result.counter_scripts?.length > 0 && (
              <SectionCard title="客服沟通话术" icon={MessageSquare} color="brand">
                <div className="space-y-3">
                  {result.counter_scripts.map((s, i) => (
                    <div key={i} className="group relative rounded-xl bg-surface-1 p-3 text-sm text-fg-secondary leading-relaxed">
                      <span className="font-semibold text-xs text-brand-500 block mb-1">话术 {i + 1}</span>
                      {s}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CopyButton text={s} />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {result.templates?.length > 0 && (
              <SectionCard title="维权模板" icon={FileText} color="emerald"
                headerExtra={<CopyButton text={buildTemplateCopy()} label="复制全部" size="md" />}>
                <div className="space-y-4">
                  {result.templates.map((t, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-fg-secondary">{t.title}</h4>
                        <CopyButton text={autoFillTemplate(t.content, templateContext)} />
                      </div>
                      <div className="letter-paper rounded-lg p-4 text-sm text-fg-secondary whitespace-pre-wrap leading-loose">
                        {autoFillTemplate(t.content, templateContext)}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {result.assumptions?.length > 0 && (
              <SectionCard title="分析假设前提" icon={Lightbulb} color="amber" defaultOpen={false}>
                <ul className="space-y-1.5">
                  {result.assumptions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-fg-muted">
                      <span className="text-amber-400 shrink-0">•</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}
          </div>
        )}

        {/* ──── CASES TAB ──── */}
        {activeTab === "cases" && (
          <div className="space-y-3 animate-fade-in">
            {result.scam_steps?.length ? (
              <SectionCard title="诈骗套路还原" icon={ShieldAlert} color="red">
                <ol className="space-y-3">
                  {result.scam_steps.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="step-card-circle flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs mt-0.5">{i + 1}</span>
                      <div>
                        <p className="text-sm font-semibold text-fg-primary">{s.step}</p>
                        <p className="text-xs text-fg-muted mt-0.5">{s.explanation}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </SectionCard>
            ) : null}

            {result.similar_cases?.length > 0 ? (
              result.similar_cases.map((c, i) => (
                <div key={i} className="card rounded-xl p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 text-xs font-bold">
                      {i + 1}
                    </div>
                    <h4 className="text-sm font-bold text-fg-primary leading-tight">{c.title}</h4>
                  </div>
                  <p className="text-xs text-fg-muted leading-relaxed">{c.pattern}</p>
                  <div className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">{c.advice}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="card rounded-xl p-6 text-center text-fg-faint text-sm">暂无相关案例参考</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
