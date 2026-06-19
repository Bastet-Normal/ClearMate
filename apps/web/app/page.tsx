"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { isLoggedIn, getStoredUser, setStoredUser } from "@/lib/local-store";
import { unifiedAnalyze } from "@/lib/unified-analyze";
import { analyzeWithProgress } from "@/lib/analyze-progress";
import type { MemberMode, AnalysisResult } from "@/types";

const RISK_BADGE: Record<string, string> = {
  critical: "risk-badge-critical",
  high: "risk-badge-high",
  medium: "risk-badge-medium",
  low: "risk-badge-low",
};

const RISK_LABEL: Record<string, string> = {
  low: "低风险", medium: "中风险", high: "高风险", critical: "极高风险",
};

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [memberMode, setMemberMode] = useState<MemberMode>("normal");
  const [quickInput, setQuickInput] = useState("");
  const [quickType, setQuickType] = useState("scam_check");
  const [quickResult, setQuickResult] = useState<AnalysisResult | null>(null);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickProgress, setQuickProgress] = useState("");
  const [quickProgressPct, setQuickProgressPct] = useState(0);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const elderPref = localStorage.getItem("cm_elder_mode");
    if (elderPref === "elder" || elderPref === "normal") {
      setMemberMode(elderPref as MemberMode);
    } else {
      const user = getStoredUser();
      if (user) setMemberMode(user.member_mode as MemberMode);
    }
  }, []);

  async function handleQuickAnalyze() {
    if (!quickInput.trim()) return;
    setQuickLoading(true);
    setQuickResult(null);
    setQuickProgress("");
    setQuickProgressPct(0);
    const result = await analyzeWithProgress(
      () => unifiedAnalyze(quickType, quickInput, ""),
      quickType,
      (step, pct) => { setQuickProgress(step); setQuickProgressPct(pct); }
    );
    setQuickResult(result);
    setQuickLoading(false);
  }

  function toggleElderMode() {
    const newMode: MemberMode = memberMode === "elder" ? "normal" : "elder";
    setMemberMode(newMode);
    localStorage.setItem("cm_elder_mode", newMode);
    const user = getStoredUser();
    if (user) setStoredUser({ ...user, member_mode: newMode });
  }

  const isElder = memberMode === "elder";

  const placeholders: Record<string, string> = {
    scam_check: "例如：收到短信说中奖了，要我转账100元解冻费",
    refund_request: "例如：淘宝买了手机，付款后卖家不发货",
    document_review: "例如：租房合同里有一条自动续费条款看不懂",
    subscription_cancel: "例如：不知道什么时候开通的会员每月扣29元",
  };

  const types = [
    { value: "scam_check", label: "这是坑吗" },
    { value: "refund_request", label: "退款投诉" },
    { value: "document_review", label: "看文件" },
    { value: "subscription_cancel", label: "订阅陷阱" },
  ];

  const tools = [
    { href: "/avoid-pit", icon: "🛡️", label: "消费避坑" },
    { href: "/self-check", icon: "✅", label: "风险自检" },
    { href: "/tasks/new?document_review", icon: "📄", label: "看懂文件" },
    { href: "/tasks/new?subscription_cancel", icon: "🔓", label: "订阅陷阱" },
  ];

  return (
    <div className={isElder ? "text-lg elder-mode" : ""}>
      <section className="bg-hero min-h-screen flex flex-col justify-center">
        <div className="mx-auto max-w-3xl w-full px-6 py-12">
          {/* 标题区 */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              遇到麻烦？先问 ClearMate
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              描述问题，AI 立刻分析风险、生成维权材料
              {loggedIn && (
                <Link href="/dashboard" className="ml-2 text-white font-semibold underline underline-offset-2 hover:text-blue-300">
                  进入仪表盘 →
                </Link>
              )}
            </p>
          </div>

          {/* 输入卡片 */}
          <div className="rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {types.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setQuickType(opt.value); setQuickResult(null); }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    quickType === opt.value
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && quickInput.trim()) handleQuickAnalyze(); }}
                placeholder={placeholders[quickType] || placeholders.scam_check}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <button
                onClick={handleQuickAnalyze}
                disabled={quickLoading || !quickInput.trim()}
                className="btn-primary shrink-0 rounded-xl px-6 py-2.5 text-sm font-semibold disabled:opacity-40"
              >
                {quickLoading ? "分析中..." : "分析"}
              </button>
            </div>

            {/* 进度 */}
            {quickLoading && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  <span className="text-xs text-slate-600">{quickProgress}</span>
                </div>
                <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${Math.round(quickProgressPct * 100)}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* 结果卡片 */}
          {quickResult && (
            <div className="mt-4 rounded-2xl bg-white p-5 shadow-xl">
              {/* 风险等级 */}
              <div className="mb-4 flex items-center gap-3">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${RISK_BADGE[quickResult.risk_level] || RISK_BADGE.low}`}>
                  {RISK_LABEL[quickResult.risk_level]}
                </span>
                <p className="text-sm font-semibold text-slate-900">{quickResult.summary}</p>
              </div>

              {/* 风险点 */}
              {quickResult.risk_points.length > 0 && quickResult.risk_points[0] !== "未发现明显风险关键词，但请保持警惕" && (
                <div className="mb-3">
                  <p className="mb-1 text-xs font-semibold text-orange-600">⚠️ 风险点</p>
                  <ul className="space-y-1">
                    {quickResult.risk_points.slice(0, 3).map((p, i) => (
                      <li key={i} className="text-xs text-slate-600 pl-3 border-l-2 border-orange-200">{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 行动指南 */}
              {(quickResult.evidence_checklist?.length > 0 || quickResult.counter_scripts?.length > 0 || quickResult.suggested_actions.length > 0) && (
                <div className="mb-3 rounded-xl bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-bold text-slate-700">🎯 你现在应该做什么</p>
                  {quickResult.evidence_checklist?.length > 0 && (
                    <div className="mb-1.5">
                      <p className="text-xs font-semibold text-blue-600 mb-0.5">📸 取证</p>
                      <p className="text-xs text-slate-600">{quickResult.evidence_checklist.slice(0, 2).join("；")}</p>
                    </div>
                  )}
                  {quickResult.counter_scripts?.length > 0 && (
                    <div className="mb-1.5">
                      <p className="text-xs font-semibold text-green-600 mb-0.5">💬 话术</p>
                      <p className="text-xs text-slate-600">{quickResult.counter_scripts[0]}</p>
                    </div>
                  )}
                  {quickResult.suggested_actions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-green-600 mb-0.5">✅ 建议</p>
                      <p className="text-xs text-slate-600">{quickResult.suggested_actions.slice(0, 2).join("；")}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 求助渠道 */}
              {quickResult.help_channels.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1.5 text-xs font-semibold text-brand-600">📞 求助渠道</p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickResult.help_channels.map((ch, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs border border-brand-100">
                        <span className="font-semibold text-brand-700">{ch.name}</span>
                        {/^\d+$/.test(ch.contact) ? (
                          <a href={`tel:${ch.contact}`} className="font-mono font-bold text-brand-600 hover:underline">{ch.contact}</a>
                        ) : (
                          <span className="font-mono font-bold text-brand-600">{ch.contact}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 模板 */}
              {quickResult.templates.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1.5 text-xs font-semibold text-slate-600">📝 可用模板</p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickResult.templates.map((t, i) => (
                      <span key={i} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{t.title}</span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-400">{quickResult.disclaimer}</p>
              {!loggedIn && (
                <Link href="/register" className="mt-3 inline-block btn-primary rounded-lg px-4 py-2 text-xs font-semibold">
                  注册保存完整分析 →
                </Link>
              )}
            </div>
          )}

          {/* 工具入口 */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {tools.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/15 hover:text-white transition-all"
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </Link>
            ))}
            <button
              onClick={toggleElderMode}
              className="ml-auto rounded-lg bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/15 hover:text-white transition-all"
            >
              {isElder ? "🔤 标准模式" : "👴 老人模式"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
