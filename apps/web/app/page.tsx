"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { isLoggedIn, getStoredUser, setStoredUser } from "@/lib/local-store";
import { analyzeTask } from "@/lib/mock-analysis";
import type { MemberMode, AnalysisResult } from "@/types";

const ENTRIES = [
  { href: "/tasks/new?scam_check", icon: "🔍", title: "这是不是坑？", desc: "判断短信、广告、兼职是否诈骗", gradient: "from-red-500 to-orange-500", shadow: "shadow-red-500/20" },
  { href: "/tasks/new?refund_request", icon: "💰", title: "退款 / 投诉 / 取消", desc: "生成投诉信、退款申请、客服话术", gradient: "from-amber-500 to-yellow-500", shadow: "shadow-amber-500/20" },
  { href: "/tasks/new?document_review", icon: "📄", title: "看懂这份文件", desc: "提取关键信息、标注风险条款", gradient: "from-blue-500 to-cyan-500", shadow: "shadow-blue-500/20" },
  { href: "/self-check", icon: "🛡️", title: "风险自检", desc: "回答几个问题，快速评估风险", gradient: "from-violet-500 to-purple-500", shadow: "shadow-violet-500/20" },
];

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [memberMode, setMemberMode] = useState<MemberMode>("normal");
  const [quickInput, setQuickInput] = useState("");
  const [quickType, setQuickType] = useState("scam_check");
  const [quickResult, setQuickResult] = useState<AnalysisResult | null>(null);
  const [quickLoading, setQuickLoading] = useState(false);

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

  function toggleElderMode() {
    const newMode: MemberMode = memberMode === "elder" ? "normal" : "elder";
    setMemberMode(newMode);
    localStorage.setItem("cm_elder_mode", newMode);
    const user = getStoredUser();
    if (user) setStoredUser({ ...user, member_mode: newMode });
    window.location.reload();
  }

  const isElder = memberMode === "elder";

  return (
    <div className={isElder ? "text-lg" : ""}>
      {/* Hero */}
      <section className="bg-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
            遇到麻烦？<br className="sm:hidden" />先问 ClearMate
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-lg sm:text-xl text-indigo-200 leading-relaxed">
            上传截图、文件，或者描述你的问题。<br />AI 帮你分析风险、看懂文件、生成维权材料。
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            {loggedIn && (
              <Link href="/dashboard" className="btn-primary rounded-2xl px-7 py-3.5 text-base font-semibold shadow-xl">
                进入仪表盘 →
              </Link>
            )}
            <button onClick={toggleElderMode} className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-5 py-3 text-sm font-medium text-white hover:bg-white/20 transition-all">
              {isElder ? "🔤 标准模式" : "👴 老人模式"}
            </button>
          </div>
        </div>
      </section>

      {/* Entry Cards */}
      <section className="mx-auto max-w-6xl px-6 -mt-12 relative z-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ENTRIES.map((entry) => (
            <Link key={entry.href} href={entry.href} className="card-hover group rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${entry.gradient} text-2xl shadow-lg ${entry.shadow}`}>
                {entry.icon}
              </div>
              <h2 className="mb-2 text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{entry.title}</h2>
              <p className="text-sm text-slate-500 leading-relaxed">{entry.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Try */}
      <section className="mx-auto max-w-6xl px-6 mt-16">
        <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-indigo-50 p-8">
          <h2 className="mb-1 text-2xl font-bold text-slate-900">⚡ 快速体验</h2>
          <p className="mb-5 text-sm text-slate-500">不用注册，直接输入你想查的内容，AI 立刻帮你分析</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {([
              { value: "scam_check", label: "🔍 这是不是坑" },
              { value: "refund_request", label: "💰 退款投诉" },
              { value: "document_review", label: "📄 看懂文件" },
            ] as const).map((opt) => (
              <button key={opt.value} onClick={() => { setQuickType(opt.value); setQuickResult(null); }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${quickType === opt.value ? "btn-primary shadow-lg shadow-brand-500/25" : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600"}`}>
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input type="text" value={quickInput} onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && quickInput.trim()) { setQuickResult(analyzeTask(quickType, quickInput, "")); } }}
              placeholder={quickType === "scam_check" ? "例如：收到短信说中奖了，要我转账100元解冻费" : quickType === "refund_request" ? "例如：淘宝买了手机，付款后卖家不发货" : "例如：租房合同里有一条自动续费条款看不懂"}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 shadow-sm"
            />
            <button onClick={() => { if (!quickInput.trim()) return; setQuickLoading(true); setQuickResult(analyzeTask(quickType, quickInput, "")); setQuickLoading(false); }}
              disabled={quickLoading || !quickInput.trim()} className="btn-primary shrink-0 rounded-xl px-8 py-3.5 text-sm font-semibold shadow-lg shadow-brand-500/25 disabled:opacity-50">
              {quickLoading ? "分析中..." : "分析"}
            </button>
          </div>

          {quickResult && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                  quickResult.risk_level === "critical" ? "bg-risk-critical/10 text-red-600" :
                  quickResult.risk_level === "high" ? "bg-risk-high/10 text-orange-600" :
                  quickResult.risk_level === "medium" ? "bg-risk-medium/10 text-amber-600" : "bg-risk-low/10 text-green-600"
                }`}>
                  {{ low: "低风险", medium: "中风险", high: "高风险", critical: "极高风险" }[quickResult.risk_level]}
                </span>
                <p className="text-sm font-semibold text-slate-800">{quickResult.summary}</p>
              </div>
              {quickResult.risk_points.length > 0 && quickResult.risk_points[0] !== "未发现明显风险关键词，但请保持警惕" && (
                <div className="mb-2"><p className="text-xs font-semibold text-orange-600 mb-1">风险点</p>
                  <ul className="space-y-0.5">{quickResult.risk_points.slice(0, 3).map((p, i) => <li key={i} className="text-xs text-slate-600 pl-3 border-l-2 border-orange-200">{p}</li>)}</ul>
                </div>
              )}
              {quickResult.suggested_actions.length > 0 && (
                <div className="mb-2"><p className="text-xs font-semibold text-green-600 mb-1">建议</p>
                  <ul className="space-y-0.5">{quickResult.suggested_actions.slice(0, 3).map((a, i) => <li key={i} className="text-xs text-slate-600 pl-3 border-l-2 border-green-200">{a}</li>)}</ul>
                </div>
              )}
              <p className="text-xs text-slate-400 mt-3">{quickResult.disclaimer}</p>
              {!loggedIn && <Link href="/register" className="mt-3 inline-block btn-primary rounded-xl px-5 py-2 text-xs font-semibold shadow-lg shadow-brand-500/25">注册保存分析记录 →</Link>}
            </div>
          )}
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-6xl px-6 mt-16 mb-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: "🛡️", title: "安全第一", desc: "涉及转账、验证码等高风险操作时，我们会醒目提醒" },
            { icon: "🔒", title: "隐私保护", desc: "敏感信息自动脱敏，你的数据只属于你" },
            { icon: "⚖️", title: "专业免责", desc: "AI 分析仅供参考，重大决策请咨询专业人士" },
          ].map((t) => (
            <div key={t.title} className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
              <div className={`mb-3 text-3xl ${isElder ? "text-4xl" : ""}`}>{t.icon}</div>
              <h3 className={`font-bold text-slate-800 ${isElder ? "text-lg" : ""}`}>{t.title}</h3>
              <p className={`mt-2 text-slate-500 ${isElder ? "text-base" : "text-sm"}`}>{t.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
