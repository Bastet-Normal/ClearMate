"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { isLoggedIn, getStoredUser, setStoredUser } from "@/lib/local-store";
import { unifiedAnalyze } from "@/lib/unified-analyze";
import { analyzeWithProgress } from "@/lib/analyze-progress";
import type { MemberMode, AnalysisResult } from "@/types";

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

  const RISK_STYLE: Record<string, string> = {
    critical: "bg-red-500 text-white",
    high: "bg-orange-500 text-white",
    medium: "bg-amber-500 text-white",
    low: "bg-green-500 text-white",
  };

  return (
    <div className={isElder ? "text-lg" : ""}>
      {/* Hero — 一屏内完成：标题+输入+结果 */}
      <section className="bg-hero relative overflow-hidden min-h-screen flex flex-col justify-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50" />
        <div className="relative mx-auto max-w-3xl w-full px-6 py-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
            遇到麻烦？先问 ClearMate
          </h1>
          <p className="mt-2 text-sm text-indigo-200">
            描述问题，AI 立刻分析风险、生成维权材料
            {loggedIn && <Link href="/dashboard" className="ml-2 text-white font-semibold underline underline-offset-2 hover:text-brand-200">进入仪表盘 →</Link>}
          </p>

          {/* 输入区 */}
          <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4 sm:p-5">
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {([
                { value: "scam_check", label: "🔍 这是坑吗" },
                { value: "refund_request", label: "💰 退款投诉" },
                { value: "document_review", label: "📄 看文件" },
                { value: "subscription_cancel", label: "🔓 订阅陷阱" },
              ] as const).map((opt) => (
                <button key={opt.value} onClick={() => { setQuickType(opt.value); setQuickResult(null); }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${quickType === opt.value ? "bg-white text-brand-700 shadow" : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={quickInput} onChange={(e) => setQuickInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && quickInput.trim()) handleQuickAnalyze(); }}
                placeholder={placeholders[quickType] || placeholders.scam_check}
                className="flex-1 rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <button onClick={handleQuickAnalyze}
                disabled={quickLoading || !quickInput.trim()}
                className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-all disabled:opacity-40 shadow">
                {quickLoading ? "..." : "分析"}
              </button>
            </div>

            {quickLoading && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span className="text-xs text-white/70">{quickProgress}</span>
                </div>
                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-white/50 transition-all duration-500" style={{ width: `${Math.round(quickProgressPct * 100)}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* 结果 — 在 Hero 内部，不跳到白底 */}
          {quickResult && (
            <div className="mt-4 rounded-2xl bg-white p-4 sm:p-5 shadow-2xl max-h-[50vh] overflow-y-auto">
              {/* 风险判定 */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${RISK_STYLE[quickResult.risk_level] || RISK_STYLE.low}`}>
                  {{ low: "低风险", medium: "中风险", high: "高风险", critical: "极高风险" }[quickResult.risk_level]}
                </span>
                <p className="text-sm font-bold text-slate-900">{quickResult.summary}</p>
              </div>

              {/* 风险点 */}
              {quickResult.risk_points.length > 0 && quickResult.risk_points[0] !== "未发现明显风险关键词，但请保持警惕" && (
                <div className="mb-2.5"><p className="text-xs font-semibold text-orange-600 mb-1">⚠️ 风险点</p>
                  <ul className="space-y-0.5">{quickResult.risk_points.slice(0, 3).map((p, i) => <li key={i} className="text-xs text-slate-600 pl-3 border-l-2 border-orange-200">{p}</li>)}</ul>
                </div>
              )}

              {/* 行动指南：取证+话术+建议+求助 合并一行式 */}
              <div className="mb-2.5 space-y-1.5">
                {quickResult.evidence_checklist?.length > 0 && (
                  <div><p className="text-xs font-semibold text-blue-600 mb-0.5">📸 取证</p>
                    <p className="text-xs text-slate-600">{quickResult.evidence_checklist.slice(0, 2).join("；")}</p>
                  </div>
                )}
                {quickResult.counter_scripts?.length > 0 && (
                  <div><p className="text-xs font-semibold text-green-600 mb-0.5">💬 话术</p>
                    <p className="text-xs text-slate-600">{quickResult.counter_scripts[0]}</p>
                  </div>
                )}
                {quickResult.suggested_actions.length > 0 && (
                  <div><p className="text-xs font-semibold text-green-600 mb-0.5">✅ 建议</p>
                    <p className="text-xs text-slate-600">{quickResult.suggested_actions.slice(0, 2).join("；")}</p>
                  </div>
                )}
              </div>

              {/* 求助渠道 — 紧凑横排 */}
              {quickResult.help_channels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {quickResult.help_channels.map((ch, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs border border-brand-100">
                      <span className="font-semibold text-brand-700">{ch.name}</span>
                      {/^\d+$/.test(ch.contact) ? (
                        <a href={`tel:${ch.contact}`} className="font-mono font-bold text-brand-600 hover:underline">{ch.contact}</a>
                      ) : (
                        <span className="font-mono font-bold text-brand-600">{ch.contact}</span>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {quickResult.templates.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {quickResult.templates.map((t, i) => (
                    <span key={i} className="rounded-lg bg-slate-50 px-2 py-0.5 text-xs text-slate-500 border border-slate-100">📝 {t.title}</span>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-slate-400">{quickResult.disclaimer}</p>
              {!loggedIn && <Link href="/register" className="mt-2 inline-block btn-primary rounded-lg px-4 py-1.5 text-xs font-semibold shadow-lg shadow-brand-500/25">注册保存 →</Link>}
            </div>
          )}

          {/* 工具入口 — Hero 底部，一行排开 */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {[
              { href: "/avoid-pit", icon: "🛡️", label: "消费避坑" },
              { href: "/self-check", icon: "✅", label: "风险自检" },
              { href: "/tasks/new?document_review", icon: "📄", label: "看懂文件" },
              { href: "/tasks/new?subscription_cancel", icon: "🔓", label: "订阅陷阱" },
            ].map((t) => (
              <Link key={t.href} href={t.href} className="flex items-center gap-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/20 hover:text-white transition-all">
                <span>{t.icon}</span><span>{t.label}</span>
              </Link>
            ))}
            <button onClick={toggleElderMode} className="ml-auto rounded-lg bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white/90 hover:bg-white/15 transition-all">
              {isElder ? "🔤 标准模式" : "👴 老人模式"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
