import type { RiskLevel, TaskStatus, TaskType } from "@/types";

/* ─────────────────────────────────────────────
   风险等级元数据 — 单一事实来源
   ───────────────────────────────────────────── */
export interface RiskMeta {
  label: string;       // 极高风险
  shortLabel: string;  // 极高
  dot: string;         // 圆点背景色
  badge: string;       // 徽章样式
  area: string;        // 区块底色 (risk-area-*)
  score: number;       // 0-100 仪表盘默认分
  color: string;       // 主色 hex
  emoji: string;
}

export const RISK_META: Record<RiskLevel, RiskMeta> = {
  critical: {
    label: "极高风险", shortLabel: "极高",
    dot: "bg-red-500",
    badge: "risk-badge-critical",
    area: "risk-area-critical",
    score: 92, color: "#dc2626", emoji: "🚨",
  },
  high: {
    label: "高风险", shortLabel: "高",
    dot: "bg-orange-500",
    badge: "risk-badge-high",
    area: "risk-area-high",
    score: 72, color: "#ea580c", emoji: "⚠️",
  },
  medium: {
    label: "中风险", shortLabel: "中",
    dot: "bg-amber-500",
    badge: "risk-badge-medium",
    area: "risk-area-medium",
    score: 48, color: "#d97706", emoji: "⚡",
  },
  low: {
    label: "低风险", shortLabel: "低",
    dot: "bg-emerald-500",
    badge: "risk-badge-low",
    area: "risk-area-low",
    score: 18, color: "#059669", emoji: "✅",
  },
};

export const RISK_ORDER: Record<RiskLevel, number> = {
  critical: 0, high: 1, medium: 2, low: 3,
};

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  critical: "极高", high: "高", medium: "中", low: "低",
};

/* ─────────────────────────────────────────────
   任务状态元数据 — 补齐 types 中全部 10 个状态
   ───────────────────────────────────────────── */
export interface StatusMeta {
  label: string;
  color: string;  // 徽章底色+文字
}

export const STATUS_META: Record<TaskStatus, StatusMeta> = {
  draft:                { label: "草稿",   color: "bg-stone-100 dark:bg-stone-700/60 text-stone-600 dark:text-stone-300" },
  pending_info:         { label: "待补充", color: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" },
  analyzing:            { label: "分析中", color: "bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300" },
  waiting_confirmation: { label: "待确认", color: "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300" },
  ready_to_execute:     { label: "待执行", color: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300" },
  in_progress:          { label: "处理中", color: "bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300" },
  waiting_response:     { label: "待回复", color: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" },
  completed:            { label: "已完成", color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" },
  failed:               { label: "已失败", color: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" },
  archived:             { label: "已归档", color: "bg-stone-100 dark:bg-stone-700/60 text-stone-400 dark:text-stone-400" },
};

/* ─────────────────────────────────────────────
   任务类型元数据
   ───────────────────────────────────────────── */
export interface TaskTypeMeta {
  label: string;     // 含 emoji
  shortLabel: string;
  emoji: string;
  color: string;     // 图标底色
}

export const TYPE_LABELS: Record<TaskType, TaskTypeMeta> = {
  scam_check:          { label: "🔍 这是不是坑",   shortLabel: "骗局识别", emoji: "🔍", color: "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400" },
  refund_request:      { label: "💰 退款/投诉",    shortLabel: "退款投诉", emoji: "💰", color: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" },
  complaint:           { label: "📢 投诉",         shortLabel: "投诉",     emoji: "📢", color: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400" },
  subscription_cancel: { label: "🔕 订阅陷阱",     shortLabel: "订阅退订", emoji: "🔕", color: "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400" },
  document_review:     { label: "📄 看懂文件",     shortLabel: "文件审查", emoji: "📄", color: "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400" },
  bill_check:          { label: "🧾 账单检查",     shortLabel: "账单检查", emoji: "🧾", color: "bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400" },
  shopping_risk:       { label: "🛒 购物风险",     shortLabel: "购物风险", emoji: "🛒", color: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" },
  general_life_issue:  { label: "📋 其他",         shortLabel: "其他",     emoji: "📋", color: "bg-stone-100 dark:bg-stone-700/60 text-stone-600 dark:text-stone-300" },
};

/* ─────────────────────────────────────────────
   分析提供者元数据
   ───────────────────────────────────────────── */
export interface ProviderMeta {
  label: string;
  color: string;
}

export const PROVIDER_META: Record<string, ProviderMeta> = {
  "gemini-oauth": { label: "Gemini · OAuth (实验)", color: "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800" },
  "gemini-key":   { label: "Gemini · API Key", color: "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800" },
  "custom-gemini":{ label: "直连 Gemini AI", color: "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800" },
  "api":          { label: "智能 AI (后端)", color: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" },
  "client-mock":  { label: "规则引擎 (本地)", color: "bg-stone-100 dark:bg-stone-700/60 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700" },
};

export function getRiskMeta(level: RiskLevel | null | undefined): RiskMeta | null {
  return level ? RISK_META[level] : null;
}

export function getStatusMeta(status: TaskStatus | string | undefined): StatusMeta {
  return (status && STATUS_META[status as TaskStatus]) || STATUS_META.draft;
}

export function getTypeMeta(type: TaskType | string | undefined): TaskTypeMeta {
  return (type && TYPE_LABELS[type as TaskType]) || TYPE_LABELS.general_life_issue;
}

export function getProviderMeta(provider: string | undefined): ProviderMeta {
  return (provider && PROVIDER_META[provider]) || PROVIDER_META["client-mock"];
}
