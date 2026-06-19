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

  return (
    <div className={isElder ? "text-lg" : ""}>
      {/* Hero — 紧凑，行动导向 */}
      <section className="bg-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50" />
        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-20 sm:pb-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
              遇到麻烦？<br />先问 ClearMate
            </h1>
            <p className="mt-4 text-base sm:text-lg text-indigo-200 leading-relaxed">
              上传截图、描述问题，AI 立刻帮你分析风险、生成维权材料。
            </p>
            {loggedIn && (
              <Link href="/dashboard" className="btn-primary mt-6 inline-flex rounded-2xl px-7 py-3 text-base font-semibold shadow-xl">
                进入仪表盘 →
              </Link>
            )}
          </div>

          {/* 快速体验 — 直接嵌入 Hero，首屏就能用 */}
          <div className="mt-10 sm:mt-12 max-w-2xl">
            <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⚡</span>
                <h2 className="text-base font-bold text-white">快速体验 — 不用注册</h2>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {([
                  { value: "scam_check", label: "🔍 这是坑吗" },
                  { value: "refund_request", label: "💰 退款投诉" },
                  { value: "document_review", label: "📄 看文件" },
                  { value: "subscription_cancel", label: "🔓 订阅陷阱" },
                ] as const).map((opt) => (
                  <button key={opt.value} onClick={() => { setQuickType(opt.value); setQuickResult(null); }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${quickType === opt.value ? "bg-white text-brand-700 shadow" : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"}`}>
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
                  className="shrink-0 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-all disabled:opacity-40 shadow">
                  {quickLoading ? "..." : "分析"}
                </button>
              </div>

              {/* Progress */}
              {quickLoading && (
                <div className="mt-3 space-y-2">
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
          </div>
        </div>
      </section>

      {/* 分析结果 — 紧跟输入框 */}
      {quickResult && (
        <section className="mx-auto max-w-6xl px-6 -mt-4 relative z-10">
          <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center gap-3">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                quickResult.risk_level === "critical" ? "bg-red-100 text-red-600" :
                quickResult.risk_level === "high" ? "bg-orange-100 text-orange-600" :
                quickResult.risk_level === "medium" ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
              }`}>
                {{ low: "低风险", medium: "中风险", high: "高风险", critical: "极高风险" }[quickResult.risk_level]}
              </span>
              <p className="text-sm font-semibold text-slate-800">{quickResult.summary}</p>
            </div>
            {quickResult.risk_points.length > 0 && quickResult.risk_points[0] !== "未发现明显风险关键词，但请保持警惕" && (
              <div className="mb-3"><p className="text-xs font-semibold text-orange-600 mb-1">风险点</p>
                <ul className="space-y-0.5">{quickResult.risk_points.slice(0, 3).map((p, i) => <li key={i} className="text-xs text-slate-600 pl-3 border-l-2 border-orange-200">{p}</li>)}</ul>
              </div>
            )}
            {quickResult.evidence_checklist?.length > 0 && (
              <div className="mb-3"><p className="text-xs font-semibold text-blue-600 mb-1">📸 取证清单</p>
                <ul className="space-y-0.5">{quickResult.evidence_checklist.slice(0, 3).map((p, i) => <li key={i} className="text-xs text-slate-600 pl-3 border-l-2 border-blue-200">{p}</li>)}</ul>
              </div>
            )}
            {quickResult.counter_scripts?.length > 0 && (
              <div className="mb-3"><p className="text-xs font-semibold text-green-600 mb-1">💬 反套路话术</p>
                <ul className="space-y-0.5">{quickResult.counter_scripts.slice(0, 3).map((a, i) => <li key={i} className="text-xs text-slate-600 pl-3 border-l-2 border-green-200">{a}</li>)}</ul>
              </div>
            )}
            {quickResult.suggested_actions.length > 0 && (
              <div className="mb-3"><p className="text-xs font-semibold text-green-600 mb-1">建议</p>
                <ul className="space-y-0.5">{quickResult.suggested_actions.slice(0, 3).map((a, i) => <li key={i} className="text-xs text-slate-600 pl-3 border-l-2 border-green-200">{a}</li>)}</ul>
              </div>
            )}
            {quickResult.help_channels.length > 0 && (
              <div className="mb-3"><p className="text-xs font-semibold text-brand-600 mb-1">📞 求助渠道</p>
                <div className="flex flex-wrap gap-2">{quickResult.help_channels.map((ch, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs border border-brand-100">
                    <span className="font-semibold text-brand-700">{ch.name}</span>
                    {/^\d+$/.test(ch.contact) ? (
                      <a href={`tel:${ch.contact}`} className="font-mono font-bold text-brand-600 hover:underline">{ch.contact}</a>
                    ) : (
                      <span className="font-mono font-bold text-brand-600">{ch.contact}</span>
                    )}
                  </span>
                ))}</div>
              </div>
            )}
            {quickResult.templates.length > 0 && (
              <div className="mb-3"><p className="text-xs font-semibold text-slate-600 mb-1">📝 可用模板</p>
                <div className="flex flex-wrap gap-2">{quickResult.templates.map((t, i) => (
                  <span key={i} className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-600 border border-slate-100">{t.title}</span>
                ))}</div>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-3">{quickResult.disclaimer}</p>
            {!loggedIn && <Link href="/register" className="mt-3 inline-block btn-primary rounded-xl px-5 py-2 text-xs font-semibold shadow-lg shadow-brand-500/25">注册保存完整分析 →</Link>}
          </div>
        </section>
      )}

      {/* 入口卡片 — 归为"更多工具"，2x2 网格 */}
      <section className="mx-auto max-w-6xl px-6 mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">更多工具</h2>
          <button onClick={toggleElderMode} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-brand-600 hover:border-brand-200 transition-all">
            {isElder ? "🔤 标准模式" : "👴 老人模式"}
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/avoid-pit", icon: "🛡️", title: "消费避坑", desc: "买前查一查，9大品类风险库", gradient: "from-violet-500 to-purple-500", shadow: "shadow-violet-500/20" },
            { href: "/self-check", icon: "✅", title: "风险自检", desc: "回答问题，快速评估风险", gradient: "from-teal-500 to-emerald-500", shadow: "shadow-teal-500/20" },
            { href: "/tasks/new?document_review", icon: "📄", title: "看懂文件", desc: "上传文件，AI 提取关键信息", gradient: "from-blue-500 to-cyan-500", shadow: "shadow-blue-500/20" },
            { href: "/tasks/new?subscription_cancel", icon: "🔓", title: "订阅陷阱", desc: "识别自动续费，给出取消路径", gradient: "from-pink-500 to-rose-500", shadow: "shadow-pink-500/20" },
          ].map((entry) => (
            <Link key={entry.href} href={entry.href} className="card-hover group rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${entry.gradient} text-xl text-white shadow-lg ${entry.shadow}`}>
                {entry.icon}
              </div>
              <h3 className="mb-1 text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{entry.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{entry.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust — 简洁 */}
      <section className="mx-auto max-w-6xl px-6 mt-12 mb-16">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center">
          {[
            { icon: "🛡️", text: "涉及转账/验证码时醒目提醒" },
            { icon: "🔒", text: "敏感信息自动脱敏" },
            { icon: "⚖️", text: "AI 分析仅供参考" },
          ].map((t) => (
            <div key={t.text} className="flex items-center gap-2">
              <span className="text-lg">{t.icon}</span>
              <span className="text-xs text-slate-500">{t.text}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
