"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ScanSearch, RefreshCw, BadgeX, FileText,
  BookOpen, BarChart3, ChevronRight, Sparkles, ShieldCheck, PlayCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isLoggedIn, getStoredUser } from "@/lib/local-store";
import { safeGetItem } from "@/lib/client-storage";
import { AnalysisWorkbench } from "@/components/features/analysis-workbench";
import type { MemberMode } from "@/types";

/* ── Feature cards ── 统一暖色图标底，去彩虹渐变 */
interface FeatureItem {
  href: string;
  icon: typeof ScanSearch;
  label: string;
  desc: string;
  tone: string;
  badge?: string;
}

const FEATURES: FeatureItem[] = [
  { href: "/tasks/new?type=scam_check",          icon: ScanSearch, label: "这是骗局吗？", desc: "识别诈骗、套路和高风险陷阱", tone: "rose",    badge: "最常用" },
  { href: "/tasks/new?type=refund_request",      icon: RefreshCw,  label: "退款/投诉",    desc: "生成证据清单和专业投诉材料", tone: "amber",   },
  { href: "/tasks/new?type=subscription_cancel", icon: BadgeX,     label: "订阅陷阱",     desc: "识别隐藏续费并生成退订流程", tone: "violet",  },
  { href: "/tasks/new?type=document_review",     icon: FileText,   label: "看懂文件",     desc: "提取合同关键条款和风险点",   tone: "sky",     },
  { href: "/avoid-pit",                          icon: BookOpen,   label: "避坑知识库",   desc: "9 大品类消费避坑指南",       tone: "emerald", },
  { href: "/self-check",                         icon: BarChart3,  label: "风险自检",     desc: "互动问答生成个人风险报告",   tone: "teal",    },
];

const TONE: Record<string, string> = {
  rose:    "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300",
  amber:   "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300",
  violet:  "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300",
  sky:     "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300",
  emerald: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300",
  teal:    "bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300",
};

/* ── 真实诈骗样例 — 供"试试示例"一键载入，零门槛体验 AI 诊断 ── */
const SCAM_SAMPLE = `【账户异常通知】
尊敬的用户，您的账户存在异常登录风险，需在 2 小时内点击 http://safe-verify-xx.cn 完成身份核验，逾期将冻结账户并影响个人征信。

如有疑问请加客服微信：safe1988（核验码请勿向他人泄露）。

完成核验需先缴纳 500 元解冻保证金，核验通过后 3 个工作日内全额退还。`;

export default function HomePage() {
  const [memberMode, setMemberMode] = useState<MemberMode>("normal");
  const [loggedIn,   setLoggedIn]   = useState(false);
  // "试试示例"载入的样例文本 + 触发 nonce（供工作台 useEffect 捕获）
  const [sample, setSample] = useState<{ text: string; n: number } | null>(null);
  const isElder = memberMode === "elder";

  const loadSample = useCallback(() => {
    setSample({ text: SCAM_SAMPLE, n: Date.now() });
    document.getElementById("workbench")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  const clearSample = useCallback(() => setSample(null), []);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const elderPref = safeGetItem("cm_elder_mode");
    const user = getStoredUser();
    setMemberMode((elderPref === "elder" || user?.member_mode === "elder") ? "elder" : "normal");

    const handler = (e: Event) => {
      setMemberMode((e as CustomEvent).detail?.isElder ? "elder" : "normal");
    };
    const onAuth = () => setLoggedIn(isLoggedIn());
    window.addEventListener("cm:elder-mode-change", handler);
    window.addEventListener("cm:auth-change", onAuth);
    return () => {
      window.removeEventListener("cm:elder-mode-change", handler);
      window.removeEventListener("cm:auth-change", onAuth);
    };
  }, []);

  return (
    <div className={cn("min-h-screen", isElder && "elder-mode")}>

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden bg-hero bg-hero-mesh">
        <div className="absolute inset-0 grid-mesh opacity-50" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 py-20 sm:py-28 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 dark:border-brand-800/60 bg-white/60 dark:bg-brand-950/30 px-4 py-1.5 text-sm text-brand-700 dark:text-brand-300 backdrop-blur-sm mb-8 animate-fade-in">
            <ShieldCheck className="h-4 w-4" />
            <span>默认本地计算 · 隐私优先</span>
          </div>

          {/* Headline — 小眉题 + 大主标 */}
          <h1 className="font-black tracking-tight text-fg-primary">
            <span className="block text-base sm:text-lg font-semibold text-fg-muted tracking-wide mb-3">
              消费者的
            </span>
            <span className={cn(
              "block text-gradient-brand leading-[1.05]",
              isElder ? "text-5xl sm:text-6xl" : "text-5xl sm:text-6xl lg:text-7xl"
            )}>
              AI 守护盾
            </span>
          </h1>

          <p className={cn(
            "mt-6 mx-auto text-fg-muted leading-relaxed",
            isElder ? "text-xl max-w-2xl" : "text-lg max-w-xl"
          )}>
            上传截图或描述遭遇，AI 秒级识别风险、生成维权材料
          </p>

          {/* CTA — 对称双按钮 */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#workbench" className={cn("btn btn-glow btn-lg", isElder && "btn-xl")}>
              <Sparkles className="h-5 w-5" />
              立即检测风险
              <ChevronRight className="h-5 w-5" />
            </a>
            <button
              type="button"
              onClick={loadSample}
              className={cn("btn btn-outline btn-lg", isElder && "btn-xl")}
            >
              <PlayCircle className="h-5 w-5" />
              试试示例
            </button>
          </div>

          {/* 注册引导（未登录） */}
          {!loggedIn && (
            <p className="mt-5 text-sm text-fg-muted">
              还没有账号？
              <Link href="/register" className="ml-1 font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
                创建本地账号
              </Link>
            </p>
          )}

          {/* 数据统计条 — 对称三栏 */}
          <div className="mt-10 flex items-stretch justify-center divide-x divide-border">
            {[
              { n: "9",    l: "品类避坑" },
              { n: "6",    l: "维权场景" },
              { n: "100%", l: "本地运行" },
            ].map((s) => (
              <div key={s.l} className="px-5 sm:px-8 text-center">
                <div className={cn("font-black text-fg-primary tabular-nums", isElder ? "text-2xl" : "text-xl sm:text-2xl")}>{s.n}</div>
                <div className="mt-0.5 text-xs text-fg-muted">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ WORKBENCH ══════════ */}
      <section id="workbench" className="page-section-alt py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className={cn("font-black text-fg-primary", isElder ? "text-3xl" : "text-2xl sm:text-3xl")}>
              立即开始智能分析
            </h2>
            <p className={cn("mt-2 text-fg-muted", isElder ? "text-lg" : "text-sm")}>
              无需注册，直接输入文本或上传截图即可分析
            </p>
          </div>

          <AnalysisWorkbench
            isElder={isElder}
            sampleText={sample?.text ?? ""}
            sampleNonce={sample?.n ?? 0}
            onSampleConsumed={clearSample}
          />
        </div>
      </section>

      {/* ══════════ FEATURES GRID ══════════ */}
      <section className="page-section-alt py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className={cn("font-black text-fg-primary", isElder ? "text-3xl" : "text-2xl sm:text-3xl")}>
              全场景消费守护
            </h2>
            <p className={cn("mt-2 text-fg-muted", isElder ? "text-lg" : "text-sm")}>
              覆盖您日常生活中最常见的 6 大消费维权场景
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {FEATURES.map(({ href, icon: Icon, label, desc, tone, badge }) => (
              <Link
                key={href}
                href={href}
                className="group card card-hover p-5 flex flex-col gap-3 animate-stagger-in"
              >
                {/* Icon */}
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110",
                  TONE[tone]
                )}>
                  <Icon className="h-6 w-6" />
                </div>

                {/* Text */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={cn("font-bold text-fg-primary", isElder ? "text-lg" : "text-base")}>{label}</h3>
                    {badge && (
                      <span className="rounded-full bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className={cn("mt-1 text-fg-muted", isElder ? "text-sm" : "text-xs")}>{desc}</p>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-1 text-brand-600 dark:text-brand-400 text-xs font-semibold group-hover:gap-2 transition-all">
                  立即使用 <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section className="page-section py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className={cn("font-black text-fg-primary mb-10", isElder ? "text-3xl" : "text-2xl sm:text-3xl")}>
            三步守护您的权益
          </h2>

          <div className="grid gap-6 sm:grid-cols-3 stagger-children">
            {[
              { step: "01", title: "上传或描述",   desc: "粘贴截图文字、上传图片/PDF，或用语音描述您的遭遇", icon: "📱" },
              { step: "02", title: "AI 智能分析",  desc: "系统自动识别风险、比对规则库、生成结构化报告", icon: "🤖" },
              { step: "03", title: "一键维权行动", desc: "复制投诉信、话术模板，按行动清单逐步维权", icon: "⚡" },
            ].map(({ step, title, desc, icon }) => (
              <div key={step} className="flex flex-col items-center text-center gap-3 animate-stagger-in">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl card shadow-card">
                    {icon}
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-black">
                    {step}
                  </div>
                </div>
                <h3 className={cn("font-bold text-fg-primary", isElder ? "text-lg" : "text-base")}>{title}</h3>
                <p className={cn("text-fg-muted max-w-xs", isElder ? "text-base" : "text-sm")}>{desc}</p>
              </div>
            ))}
          </div>

          {/* Privacy guarantee */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-fg-muted">
            {[
              { icon: "🔒", text: "默认本地存储；启用云端模型时仅发送本次分析内容" },
              { icon: "🛡️", text: "API密钥仅保存在您的浏览器" },
              { icon: "📋", text: "AI结果仅供参考，附详细免责说明" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
