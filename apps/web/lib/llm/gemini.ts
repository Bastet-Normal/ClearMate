/**
 * Gemini 直连调用 — API Key 与 Google OAuth 共用
 *
 * 两种鉴权：
 *   { apiKey }      —— URL 带 ?key=，用户自填 Key
 *   { accessToken } —— Authorization: Bearer，来自 Google 登录（gemini-oauth）
 *
 * 浏览器可直接调用 generativelanguage.googleapis.com（支持 CORS）。
 */

import type { AnalysisResult } from "@/types";
import { getStoredProfile } from "@/lib/local-store";

/** 默认模型；如需更换（如 gemini-2.5-pro / gemini-2.0-flash）改此处即可。 */
export const GEMINI_MODEL = "gemini-2.5-flash";

export type GeminiAuth = { apiKey: string } | { accessToken: string; quotaProjectId?: string };

const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

function buildPrompt(taskType: string, title: string, description: string): string {
  const profile = getStoredProfile();
  const profileInstructions =
    profile.real_name || profile.phone
      ? `申诉人个人信息：姓名为 "${profile.real_name || "未提供"}"，联系电话为 "${profile.phone || "未提供"}"。如果姓名或电话已提供，请在生成的维权信/申诉公文模板正文中，直接将对应的占位符替换为具体的值，避免只输出空占位符。`
      : "";

  return `你是一位专业的消费者权益保护律师和反欺诈专家。
请分析用户提交的消费问题或可疑骗局。
输入事件标题: "${title}"
输入事件描述: "${description}"
任务类别: "${taskType}" (scam_check: 防坑防骗, refund_request: 退款投诉, document_review: 合同霸王条款分析, subscription_cancel: 自动续费退订)
${profileInstructions}

根据提供的 JSON Schema 返回详细的诊断分析结果。要求：
1. 风险评级 (risk_level) 只能是: "low" (低风险), "medium" (中风险), "high" (高风险), "critical" (极高风险)。
2. 要点分析 (key_facts) 从描述中提取时间、金额、涉事主体、订单号等。
3. 维权模板 (templates) 中的姓名、电话、金额、商家等关键信息，请使用标准的 [你的姓名]、[手机号]、[金额]、[商家名称] 等中括号占位符，以便前端自动识别并替换。如果上面已提供了申诉人信息，请在生成内容中优先直接替换。
4. 话术 (counter_scripts) 应该提供可以直接复制去和客服谈判的强硬、有法可依的话术。
5. 必须返回符合 JSON 结构的完整内容。`;
}

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    risk_level: { type: "STRING", enum: ["low", "medium", "high", "critical"] },
    risk_points: { type: "ARRAY", items: { type: "STRING" } },
    key_facts: { type: "ARRAY", items: { type: "STRING" } },
    suggested_actions: { type: "ARRAY", items: { type: "STRING" } },
    evidence_checklist: { type: "ARRAY", items: { type: "STRING" } },
    counter_scripts: { type: "ARRAY", items: { type: "STRING" } },
    templates: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          content: { type: "STRING" },
        },
        required: ["title", "content"],
      },
    },
    similar_cases: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          pattern: { type: "STRING" },
          advice: { type: "STRING" },
        },
        required: ["title", "pattern", "advice"],
      },
    },
  },
  required: [
    "summary",
    "risk_level",
    "risk_points",
    "key_facts",
    "suggested_actions",
    "evidence_checklist",
    "counter_scripts",
    "templates",
    "similar_cases",
  ],
} as const;

/** 将 LLM 返回的原始 JSON 标准化为前端 AnalysisResult（缺失字段补默认值） */
export function normalizeAnalysisResult(
  raw: Record<string, unknown>
): AnalysisResult {
  return {
    summary: (raw.summary as string) || "分析完成",
    risk_level: (raw.risk_level as AnalysisResult["risk_level"]) || "medium",
    risk_points: (raw.risk_points as string[]) || [],
    key_facts: (raw.key_facts as string[]) || [],
    assumptions: (raw.assumptions as string[]) || [],
    suggested_actions: (raw.suggested_actions as string[]) || [],
    questions_to_verify: (raw.questions_to_verify as string[]) || [],
    evidence_checklist: (raw.evidence_checklist as string[]) || [],
    counter_scripts: (raw.counter_scripts as string[]) || [],
    help_channels: (raw.help_channels as AnalysisResult["help_channels"]) || [],
    templates: (raw.templates as AnalysisResult["templates"]) || [],
    scam_steps: (raw.scam_steps as AnalysisResult["scam_steps"]) || undefined,
    similar_cases: (raw.similar_cases as AnalysisResult["similar_cases"]) || [],
    disclaimer:
      (raw.disclaimer as string) ||
      "本分析仅供参考，不构成法律、金融或医疗建议。",
  };
}

export async function callGemini(
  taskType: string,
  title: string,
  description: string,
  auth: GeminiAuth
): Promise<AnalysisResult> {
  const useApiKey = "apiKey" in auth;
  const url = useApiKey
    ? `${ENDPOINT(GEMINI_MODEL)}?key=${auth.apiKey}`
    : ENDPOINT(GEMINI_MODEL);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (!useApiKey) {
    headers["Authorization"] = `Bearer ${auth.accessToken}`;
    if (auth.quotaProjectId) headers["x-goog-user-project"] = auth.quotaProjectId;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(taskType, title, description) }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    // 尝试取出错误信息
    let detail = "";
    try {
      const ej = await response.json();
      detail = ej?.error?.message || "";
    } catch {}
    throw new Error(
      `Gemini API error: ${response.status} ${response.statusText}${detail ? ` — ${detail}` : ""}`
    );
  }

  const data = await response.json();
  const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) {
    throw new Error("Gemini 返回为空");
  }
  return normalizeAnalysisResult(JSON.parse(textResponse));
}
