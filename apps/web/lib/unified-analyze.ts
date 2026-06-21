/**
 * 统一分析入口
 * 
 * 根据 LLM 模式选择：
 * - local：浏览器内 mock-analysis
 * - api：调用后端 FastAPI（后端代理真实 LLM）
 * 
 * API 模式需要先确保后端已登录（有有效 JWT），
 * 否则自动 fallback 到 local 模式。
 */

import { analyzeTask as mockAnalyzeTask } from "./mock-analysis";
import type { AnalysisResult } from "@/types";
import { getLLMMode } from "./llm-mode";
import { isLoggedIn, getStoredProfile } from "./local-store";

/**
 * 检查 API 模式是否可用（模式=api 且 已登录）
 * 未登录时后端会 401，不如直接 fallback
 */
function canUseApi(): boolean {
  return getLLMMode() === "api" && isLoggedIn();
}

/**
 * 调用后端 API 分析
 * 
 * 流程：
 * 1. 在后端创建任务（需要 JWT）
 * 2. 触发分析（后端调 LLM）
 * 3. 返回 result_json
 * 
 * 后端 LLM 返回的字段可能比前端 AnalysisResult 少
 * （后端 base.AnalysisResult 只有基础字段），
 * 缺失字段用默认值补齐。
 */
async function callApiAnalysis(
  taskType: string,
  title: string,
  description: string
): Promise<AnalysisResult> {
  const { apiCreateTask, apiCreateAnalysis } = await import("./api-client");
  
  // 1. 创建任务
  const task = await apiCreateTask({ title, task_type: taskType, description });
  
  // 2. 触发分析
  const analysis = await apiCreateAnalysis(task.id);
  
  // 3. 合并结果：后端字段 + 前端默认值
  const raw = analysis.result_json as Record<string, unknown>;
  return normalizeApiResult(raw);
}

/**
 * 将后端返回的 result_json 标准化为前端 AnalysisResult
 * 
 * 后端 LLM 可能只返回基础字段（summary/risk_level/risk_points 等），
 * 前端需要的 evidence_checklist/counter_scripts/templates 等可能缺失。
 * 用默认空数组补齐，保证前端不报错。
 */
function normalizeApiResult(raw: Record<string, unknown>): AnalysisResult {
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
    disclaimer: (raw.disclaimer as string) || "本分析仅供参考，不构成法律、金融或医疗建议。",
  };
}

function getCustomApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cm_custom_gemini_key");
}

async function callCustomGeminiAnalysis(
  taskType: string,
  title: string,
  description: string,
  apiKey: string
): Promise<AnalysisResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const profile = getStoredProfile();
  const profileInstructions = (profile.real_name || profile.phone)
    ? `申诉人个人信息：姓名为 "${profile.real_name || '未提供'}"，联系电话为 "${profile.phone || '未提供'}"。如果姓名或电话已提供，请在生成的维权信/申诉公文模板正文中，直接将对应的占位符替换为具体的值，避免只输出空占位符。`
    : "";

  const systemInstruction = `你是一位专业的消费者权益保护律师和反欺诈专家。
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

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: systemInstruction
        }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
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
                  content: { type: "STRING" }
                },
                required: ["title", "content"]
              }
            },
            similar_cases: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  pattern: { type: "STRING" },
                  advice: { type: "STRING" }
                },
                required: ["title", "pattern", "advice"]
              }
            }
          },
          required: ["summary", "risk_level", "risk_points", "key_facts", "suggested_actions", "evidence_checklist", "counter_scripts", "templates", "similar_cases"]
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) {
    throw new Error("Empty response from Gemini API");
  }

  const raw = JSON.parse(textResponse);
  return normalizeApiResult(raw);
}

/**
 * 统一分析函数
 * - custom_key 模式：如果本地存有自定义 API Key，直接前端调用 Gemini API
 * - local 模式：浏览器内 mock-analysis
 * - api 模式：调用后端 FastAPI → 真实 LLM
 * - api/custom_key 失败时自动 fallback 到 local
 */
export async function unifiedAnalyze(
  taskType: string,
  title: string,
  description: string
): Promise<AnalysisResult> {
  const customKey = getCustomApiKey();
  if (customKey && customKey.trim()) {
    try {
      const res = await callCustomGeminiAnalysis(taskType, title, description, customKey);
      res._provider = "custom-gemini";
      res._model = "gemini-1.5-flash";
      return res;
    } catch (err: any) {
      console.warn("自定义 API Key 分析失败，回退到本地分析:", err.message);
      const res = mockAnalyzeTask(taskType, title, description);
      res._provider = "client-mock";
      res._model = "client-v2";
      res._error = `自定义 API 密钥调用失败 (${err.message})，已自动回退到本地引擎`;
      return res;
    }
  }

  if (canUseApi()) {
    try {
      const res = await callApiAnalysis(taskType, title, description);
      res._provider = "api";
      res._model = "backend-llm";
      return res;
    } catch (err: any) {
      console.warn("API 分析失败，回退到本地分析:", err.message);
      const res = mockAnalyzeTask(taskType, title, description);
      res._provider = "client-mock";
      res._model = "client-v2";
      res._error = `后端 AI 引擎连接失败 (${err.message})，已自动回退到本地引擎`;
      return res;
    }
  }
  
  const res = mockAnalyzeTask(taskType, title, description);
  res._provider = "client-mock";
  res._model = "client-v2";
  return res;
}

/**
 * 检查后端是否可用
 */
export async function checkApiAvailable(): Promise<boolean> {
  try {
    const { apiHealthCheck } = await import("./api-client");
    return await apiHealthCheck();
  } catch {
    return false;
  }
}

