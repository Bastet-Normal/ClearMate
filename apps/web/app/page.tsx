"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { isLoggedIn, getStoredUser, setStoredUser } from "@/lib/local-store";
import { analyzeTask } from "@/lib/mock-analysis";
import type { MemberMode, AnalysisResult } from "@/types";

const ENTRIES = [
  {
    href: "/tasks/new?scam_check",
    icon: "🔍",
    title: "这是不是坑？",
    description: "收到可疑短信、广告、兼职信息？帮你判断是不是诈骗或套路，告诉你下一步怎么做。",
    color: "border-red-100 bg-red-50/50",
    hoverColor: "hover:border-red-300 hover:bg-red-50",
  },
  {
    href: "/tasks/new?refund_request",
    icon: "💰",
    title: "帮我退款 / 投诉 / 取消",
    description: "买了东西想退款、被坑了想投诉、订阅想取消？帮你生成投诉信、退款申请、客服话术。",
    color: "border-amber-100 bg-amber-50/50",
    hoverColor: "hover:border-amber-300 hover:bg-amber-50",
  },
  {
    href: "/tasks/new?document_review",
    icon: "📄",
    title: "帮我看懂这份文件",
    description: "合同、账单、通知看不懂？帮你提取关键信息、标注风险条款、用大白话解释给你听。",
    color: "border-blue-100 bg-blue-50/50",
    hoverColor: "hover:border-blue-300 hover:bg-blue-50",
  },
  {
    href: "/self-check",
    icon: "🛡️",
    title: "风险自检",
    description: "不确定有没有被骗？回答几个问题，快速评估你的风险状况。",
    color: "border-purple-100 bg-purple-50/50",
    hoverColor: "hover:border-purple-300 hover:bg-purple-50",
  },
];

const TRUST = [
  { icon: "🛡️", title: "安全第一", desc: "涉及转账、验证码等高风险操作时，我们会醒目提醒" },
  { icon: "🔒", title: "隐私保护", desc: "敏感信息自动脱敏，你的数据只属于你" },
  { icon: "⚖️", title: "专业免责", desc: "AI 分析仅供参考，重大决策请咨询专业人士" },
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
    // 优先读独立 key，其次读 user.member_mode
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
    // 持久化到独立 key，不依赖用户登录状态
    localStorage.setItem("cm_elder_mode", newMode);
    const user = getStoredUser();
    if (user) {
      setStoredUser({ ...user, member_mode: newMode });
    }
    window.location.reload();
  }

  const isElder = memberMode === "elder";

  return (
    <div className={`mx-auto max-w-5xl px-4 py-12 ${isElder ? "text-lg" : ""}`}>
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className={`mb-4 font-bold tracking-tight text-gray-900 ${isElder ? "text-5xl" : "text-4xl sm:text-5xl"}`}>
          遇到麻烦？先问 ClearMate
        </h1>
        <p className={`mx-auto max-w-2xl text-gray-600 leading-relaxed ${isElder ? "text-xl" : "text-lg"}`}>
          上传截图、文件，或者描述你的问题。
          <br />
          AI 帮你分析风险、看懂文件、生成维权材料。
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          {loggedIn && (
            <Link
              href="/dashboard"
              className={`inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-brand-700 transition-colors ${isElder ? "text-base" : "text-sm"}`}
            >
              进入仪表盘 →
            </Link>
          )}
          <button
            onClick={toggleElderMode}
            className={`inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-600 hover:bg-gray-50 transition-colors ${isElder ? "text-base" : "text-sm"}`}
          >
            {isElder ? "🔤 标准模式" : "👴 老人模式"}
          </button>
        </div>
      </div>

      {/* Entry Points */}
      <div className={`grid gap-6 sm:grid-cols-2 ${ENTRIES.length > 3 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {ENTRIES.map((entry) => (
          <Link
            key={entry.href}
            href={entry.href}
            className={`group block rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${entry.color} ${entry.hoverColor}`}
          >
            <div className={`mb-4 flex items-center justify-center rounded-xl bg-white/80 ${isElder ? "h-16 w-16 text-3xl" : "h-14 w-14 text-2xl"}`}>
              {entry.icon}
            </div>
            <h2 className={`mb-2 font-bold text-gray-900 ${isElder ? "text-xl" : "text-xl"}`}>{entry.title}</h2>
            <p className={`text-gray-600 leading-relaxed ${isElder ? "text-base" : "text-sm"}`}>{entry.description}</p>
          </Link>
        ))}
      </div>

      {/* Quick Try - 零注册体验 */}
      <div className="mb-16 rounded-2xl border-2 border-brand-100 bg-brand-50/30 p-6">
        <h2 className="mb-2 text-lg font-bold text-gray-900">⚡ 快速体验</h2>
        <p className="mb-4 text-sm text-gray-500">不用注册，直接输入你想查的内容，AI 立刻帮你分析</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {([
            { value: "scam_check", label: "🔍 这是不是坑" },
            { value: "refund_request", label: "💰 退款投诉" },
            { value: "document_review", label: "📄 看懂文件" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setQuickType(opt.value); setQuickResult(null); }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${quickType === opt.value ? "bg-brand-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && quickInput.trim()) { setQuickLoading(true); setQuickResult(analyzeTask(quickType, quickInput, "")); setQuickLoading(false); } }}
            placeholder={
              quickType === "scam_check" ? "例如：收到短信说中奖了，要我转账100元解冻费" :
              quickType === "refund_request" ? "例如：淘宝买了手机，付款后卖家不发货" :
              "例如：租房合同里有一条自动续费条款看不懂"
            }
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <button
            onClick={() => { if (!quickInput.trim()) return; setQuickLoading(true); setQuickResult(analyzeTask(quickType, quickInput, "")); setQuickLoading(false); }}
            disabled={quickLoading || !quickInput.trim()}
            className="shrink-0 rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {quickLoading ? "分析中..." : "分析"}
          </button>
        </div>

        {quickResult && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                quickResult.risk_level === "critical" ? "bg-red-100 text-red-700" :
                quickResult.risk_level === "high" ? "bg-orange-100 text-orange-700" :
                quickResult.risk_level === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
              }`}>
                {{ low: "低风险", medium: "中风险", high: "高风险", critical: "极高风险" }[quickResult.risk_level]}
              </span>
              <p className="text-sm font-medium text-gray-900">{quickResult.summary}</p>
            </div>
            {quickResult.risk_points.length > 0 && quickResult.risk_points[0] !== "未发现明显风险关键词，但请保持警惕" && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-orange-700 mb-1">风险点：</p>
                <ul className="space-y-0.5">{quickResult.risk_points.slice(0, 3).map((p, i) => <li key={i} className="text-xs text-gray-600 pl-2 border-l-2 border-gray-100">{p}</li>)}</ul>
              </div>
            )}
            {quickResult.suggested_actions.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-green-700 mb-1">建议：</p>
                <ul className="space-y-0.5">{quickResult.suggested_actions.slice(0, 3).map((a, i) => <li key={i} className="text-xs text-gray-600 pl-2 border-l-2 border-gray-100">{a}</li>)}</ul>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">{quickResult.disclaimer}</p>
            {!loggedIn && (
              <Link href="/register" className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white hover:bg-brand-700 transition-colors">
                注册保存分析记录 →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Trust Signals */}
      <div className="mt-16 rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {TRUST.map((t) => (
            <div key={t.title} className="text-center">
              <div className={`mb-2 ${isElder ? "text-3xl" : "text-2xl"}`}>{t.icon}</div>
              <h3 className={`font-semibold text-gray-900 ${isElder ? "text-lg" : ""}`}>{t.title}</h3>
              <p className={`mt-1 text-gray-500 ${isElder ? "text-base" : "text-sm"}`}>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className={`text-gray-400 ${isElder ? "text-sm" : "text-xs"}`}>
          数据存储在你本地浏览器，不上传服务器 · 适用于 GitHub Pages 部署
        </p>
      </div>
    </div>
  );
}
