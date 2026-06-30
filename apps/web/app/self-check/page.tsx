"use client";

import { useState, useEffect } from "react";
import { Volume2, VolumeX, ChevronLeft, RotateCcw, ChevronRight, ShieldCheck, AlertTriangle, Phone } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { safeGetItem, safeSetItem } from "@/lib/client-storage";
import { Segmented } from "@/components/ui/segmented";

interface Question { id: string; text: string; isDanger: boolean; }

const STORAGE_KEY = "cm_self_check_results";

const CHECKLISTS = [
  {
    title: "诈骗风险自检", desc: "检查你是否正在遭遇诈骗", icon: "🔍",
    questions: [
      { id: "q1", text: "对方要求你转账或付款", isDanger: true },
      { id: "q2", text: "对方要求你提供验证码", isDanger: true },
      { id: "q3", text: "对方要求你加微信/QQ私下沟通", isDanger: true },
      { id: "q4", text: "对方承诺高回报、零风险", isDanger: true },
      { id: "q5", text: "对方制造紧迫感（限时、马上）", isDanger: true },
      { id: "q6", text: "你无法通过官方渠道核实对方身份", isDanger: true },
      { id: "q7", text: "对方声称你中奖或免费领取", isDanger: true },
      { id: "q8", text: "对方要求先交保证金/解冻费", isDanger: true },
    ],
  },
  {
    title: "消费维权自检", desc: "检查你的消费权益是否受损", icon: "💰",
    questions: [
      { id: "c1", text: "商品与描述严重不符", isDanger: true },
      { id: "c2", text: "商家拒绝退款/退货", isDanger: true },
      { id: "c3", text: "被自动续费扣款但不知情", isDanger: true },
      { id: "c4", text: "收到商品后发现有质量问题", isDanger: true },
      { id: "c5", text: "商家虚假宣传/误导消费", isDanger: true },
      { id: "c6", text: "订单超时未发货且联系不上商家", isDanger: true },
    ],
  },
  {
    title: "合同风险自检", desc: "检查合同/协议是否有风险条款", icon: "📄",
    questions: [
      { id: "d1", text: "有不公平的违约条款", isDanger: true },
      { id: "d2", text: "有自动续费/自动展期条款", isDanger: true },
      { id: "d3", text: "有单方变更权条款", isDanger: true },
      { id: "d4", text: "有过度授权个人信息条款", isDanger: true },
      { id: "d5", text: "金额/期限条款模糊不清", isDanger: true },
    ],
  },
];

interface SavedResult {
  listIndex: number; answers: Record<string, boolean>;
  dangerCount: number; totalCount: number; timestamp: string;
}

function loadResults(): SavedResult[] {
  try { return JSON.parse(safeGetItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function saveResults(results: SavedResult[]) {
  safeSetItem(STORAGE_KEY, JSON.stringify(results));
}

function getSavedResult(listIndex: number): SavedResult | undefined {
  return loadResults().find((item) => item?.listIndex === listIndex);
}

export default function SelfCheckPage() {
  const [activeList, setActiveList] = useState(0);
  const [answers, setAnswers]       = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted]   = useState(false);
  const [hasSaved, setHasSaved]     = useState(false);
  const [isPlaying, setIsPlaying]   = useState(false);
  // 缓存保存结果，避免 render 期反复读 localStorage
  const [savedFlags, setSavedFlags] = useState<boolean[]>([]);

  const list         = CHECKLISTS[activeList];
  const dangerCount  = list.questions.filter(q => answers[q.id]).length;
  const totalCount   = list.questions.length;
  const progress     = submitted ? dangerCount / totalCount : Object.keys(answers).length / totalCount;

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  useEffect(() => {
    window.speechSynthesis?.cancel(); setIsPlaying(false);
    const saved = getSavedResult(activeList);
    if (saved) { setAnswers(saved.answers); setSubmitted(true); setHasSaved(true); }
    else       { setAnswers({}); setSubmitted(false); setHasSaved(false); }
  }, [activeList]);

  // 一次性加载所有列表的已保存标记
  useEffect(() => {
    const all = loadResults();
    setSavedFlags(CHECKLISTS.map((_, i) => all.some((item) => item?.listIndex === i)));
  }, []);

  function refreshSavedFlags() {
    const all = loadResults();
    setSavedFlags(CHECKLISTS.map((_, i) => all.some((item) => item?.listIndex === i)));
  }

  function speakResult() {
    if (!window.speechSynthesis) return;
    if (isPlaying) { window.speechSynthesis.cancel(); setIsPlaying(false); return; }
    const isElder = safeGetItem("cm_elder_mode") === "elder";
    const text = dangerCount >= 4
      ? `高度警惕！您勾选了${dangerCount}项风险信号。建议立即拨打96110反诈中心咨询，如已转账请拨打110报警。`
      : dangerCount >= 2
      ? `存在${dangerCount}项风险信号，建议谨慎处理，通过官方渠道核实后再行动。`
      : `有${dangerCount}项少量风险信号，保持警惕即可。`;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "zh-CN"; utt.rate = isElder ? 0.85 : 1.0;
    utt.onend = utt.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utt); setIsPlaying(true);
  }

  function toggle(id: string) { setAnswers(p => ({ ...p, [id]: !p[id] })); setSubmitted(false); setHasSaved(false); }
  function submit() {
    setSubmitted(true); setHasSaved(true);
    const current: SavedResult = { listIndex: activeList, answers, dangerCount, totalCount, timestamp: new Date().toISOString() };
    const r = loadResults().filter((item) => item?.listIndex !== activeList);
    r.push(current);
    saveResults(r);
    refreshSavedFlags();
  }
  function reset() {
    setAnswers({}); setSubmitted(false); setHasSaved(false);
    const r = loadResults().filter((item) => item.listIndex !== activeList);
    saveResults(r);
    refreshSavedFlags();
  }

  const riskLevel = dangerCount >= 4 ? "critical" : dangerCount >= 2 ? "medium" : "low";

  return (
    <div className="min-h-screen page-bg">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12 space-y-6">

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-brand-600 dark:hover:text-brand-400 transition-colors animate-fade-in">
          <ChevronLeft className="h-4 w-4" /> 返回首页
        </Link>

        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-black text-fg-primary">🛡️ 风险自检</h1>
          <p className="mt-1 text-sm text-fg-muted">回答几个问题，快速评估您的风险状况</p>
        </div>

        {/* Tabs */}
        <div className="animate-fade-in">
          <Segmented
            options={CHECKLISTS.map((cl, i) => ({
              value: String(i),
              label: <span className="hidden sm:inline">{cl.title}</span>,
              icon: <span>{cl.icon}</span>,
              badge: savedFlags[i] ? <span className="h-2 w-2 rounded-full bg-emerald-500" /> : undefined,
            }))}
            value={String(activeList)}
            onChange={(v) => setActiveList(Number(v))}
            scrollable
            size="sm"
          />
        </div>

        {/* Checklist card */}
        <div className="card rounded-2xl overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-xl">
                {list.icon}
              </div>
              <div>
                <h2 className="text-lg font-bold">{list.title}</h2>
                <p className="text-sm text-white/80">{list.desc}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-white/80 transition-all duration-500" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>

          {/* Questions */}
          <div className="p-5 space-y-2">
            {list.questions.map((q) => (
              <label key={q.id} className={cn(
                "flex items-center gap-3 cursor-pointer rounded-xl p-3 transition-all border",
                answers[q.id]
                  ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                  : "border-transparent hover:bg-surface-1"
              )}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={!!answers[q.id]}
                  onChange={() => toggle(q.id)}
                />
                <div className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                  answers[q.id]
                    ? "bg-red-500 border-red-500 text-white"
                    : "border-border-strong"
                )}>
                  {answers[q.id] && (
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className={cn(
                  "text-sm leading-relaxed",
                  answers[q.id] ? "text-red-700 dark:text-red-400 font-semibold" : "text-fg-secondary"
                )}>
                  {q.text}
                </span>
                {answers[q.id] && <AlertTriangle className="h-3.5 w-3.5 text-red-400 ml-auto shrink-0" />}
              </label>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-fg-muted">
                风险信号 <span className="font-bold text-fg-primary">{dangerCount}</span> / {totalCount}
              </span>
              {hasSaved && submitted && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ 已保存</span>}
            </div>
            <div className="flex gap-2">
              {submitted && (
                <button onClick={reset} className="btn btn-sm btn-ghost text-fg-muted">
                  <RotateCcw className="h-3.5 w-3.5" /> 重来
                </button>
              )}
              <button onClick={submit} className="btn btn-sm btn-primary">
                <ShieldCheck className="h-3.5 w-3.5" /> 查看结果
              </button>
            </div>
          </div>
        </div>

        {/* Result */}
        {submitted && (
          <div className={cn("card rounded-2xl overflow-hidden animate-scale-in", riskLevel === "critical" && "ring-2 ring-red-300 dark:ring-red-700/60")}>
            {/* Risk accent */}
            <div className={cn("h-1.5 w-full", {
              "bg-red-500":     riskLevel === "critical",
              "bg-amber-500":   riskLevel === "medium",
              "bg-emerald-500": riskLevel === "low",
            })} />

            <div className="p-5 sm:p-6 space-y-4">
              {/* Title + TTS */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className={cn("text-lg font-bold", {
                  "text-red-700 dark:text-red-400":     riskLevel === "critical",
                  "text-amber-700 dark:text-amber-400": riskLevel === "medium",
                  "text-emerald-700 dark:text-emerald-400": riskLevel === "low",
                })}>
                  {riskLevel === "critical" ? "🚨 高度警惕！你可能正在遭遇风险" :
                   riskLevel === "medium"   ? "⚠️ 存在风险信号，需要警惕" :
                                              "✅ 少量风险信号，保持警惕"}
                </h3>
                <button onClick={speakResult} className={cn("btn btn-sm", isPlaying ? "btn-danger" : "btn-secondary")}>
                  {isPlaying ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  {isPlaying ? "停止" : "朗读"}
                </button>
              </div>

              <p className={cn("text-sm leading-relaxed", {
                "text-red-600 dark:text-red-400":     riskLevel === "critical",
                "text-amber-600 dark:text-amber-400": riskLevel === "medium",
                "text-emerald-600 dark:text-emerald-400": riskLevel === "low",
              })}>
                您勾选了 <span className="font-bold">{dangerCount}</span> / {totalCount} 项风险信号
                {riskLevel === "critical" ? "，表明您正在面临严重风险。请立即停止任何转账/付款操作！" :
                 riskLevel === "medium"   ? "，建议谨慎处理，通过官方渠道核实后再行动。" :
                                            "，保持警惕即可，建议通过官方渠道核实。"}
              </p>

              {/* Emergency contacts for critical */}
              {riskLevel === "critical" && (
                <div className="space-y-2 rounded-xl bg-red-50 dark:bg-red-950/30 p-4 border border-red-200 dark:border-red-800">
                  <p className="text-sm font-bold text-red-800 dark:text-red-300">建议立即：</p>
                  <div className="space-y-1.5">
                    <a href="tel:96110" className="flex items-center gap-2 rounded-lg bg-surface-0 dark:bg-surface-1 p-2.5 border border-red-200 dark:border-red-800 hover:shadow-md transition-all">
                      <Phone className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-700 dark:text-red-400">拨打 <span className="font-mono font-bold">96110</span> 反诈中心咨询</span>
                    </a>
                    <a href="tel:110" className="flex items-center gap-2 rounded-lg bg-surface-0 dark:bg-surface-1 p-2.5 border border-red-200 dark:border-red-800 hover:shadow-md transition-all">
                      <Phone className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-700 dark:text-red-400">如已转账，立即拨打 <span className="font-mono font-bold">110</span> 报警</span>
                    </a>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-500 mt-2">保留所有聊天记录和转账凭证！</p>
                </div>
              )}

              <Link href="/tasks/new" className="btn btn-md btn-primary inline-flex">
                创建任务让 AI 详细分析 <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
