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
import { isLoggedIn } from "./local-store";

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

/**
 * 统一分析函数
 * - local 模式：浏览器内 mock-analysis
 * - api 模式：调用后端 FastAPI → 真实 LLM
 * - api 失败时自动 fallback 到 local
 */
export async function unifiedAnalyze(
  taskType: string,
  title: string,
  description: string
): Promise<AnalysisResult> {
  if (canUseApi()) {
    try {
      return await callApiAnalysis(taskType, title, description);
    } catch (err: any) {
      console.warn("API 分析失败，回退到本地分析:", err.message);
      return mockAnalyzeTask(taskType, title, description);
    }
  }
  
  return mockAnalyzeTask(taskType, title, description);
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
