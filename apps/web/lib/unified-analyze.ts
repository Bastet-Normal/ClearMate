/**
 * 统一分析入口（模式驱动）
 *
 * 按 LLM 模式选择引擎，失败自动回退本地规则引擎：
 * - "gemini-oauth"：Google OAuth 短期 token 直连 Gemini（实验通道）
 * - "gemini-key"：自填 API Key 直连 Gemini
 * - "api"：后端 FastAPI 代理真实 LLM（需登录 + 后端可用）
 * - "local"（默认/兜底）：浏览器内 mock-analysis
 *
 * 任何模式失败都会 fallback 到本地引擎并附带 _error 提示，
 * 保证用户永远能拿到结果，不白屏。
 */

import { analyzeTask as mockAnalyzeTask } from "./mock-analysis";
import type { AnalysisResult } from "@/types";
import { getGeminiApiKey, getLLMMode } from "./llm-mode";
import { isLoggedIn } from "./local-store";
import { callGemini, GEMINI_MODEL, normalizeAnalysisResult } from "./llm/gemini";
import { getValidAccessToken, GOOGLE_CLOUD_PROJECT_ID } from "./gemini-oauth";

function getCustomApiKey(): string | null {
  return getGeminiApiKey();
}

/** 本地兜底结果 */
function fallback(
  taskType: string,
  title: string,
  description: string,
  error?: string
): AnalysisResult {
  const res = mockAnalyzeTask(taskType, title, description);
  res._provider = "client-mock";
  res._model = "client-v2";
  if (error) res._error = error;
  return res;
}

/* ── 后端 API 模式 ── */
async function callApiAnalysis(
  taskType: string,
  title: string,
  description: string
): Promise<AnalysisResult> {
  const { apiCreateTask, apiCreateAnalysis } = await import("./api-client");
  const task = await apiCreateTask({ title, task_type: taskType, description });
  const analysis = await apiCreateAnalysis(task.id);
  const raw = analysis.result_json as Record<string, unknown>;
  return normalizeAnalysisResult(raw);
}

function canUseApi(): boolean {
  return getLLMMode() === "api" && isLoggedIn();
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

/**
 * 统一分析函数 — 按当前 LLM 模式分发
 */
export async function unifiedAnalyze(
  taskType: string,
  title: string,
  description: string
): Promise<AnalysisResult> {
  const mode = getLLMMode();

  /* ① Gemini OAuth */
  if (mode === "gemini-oauth") {
    const token = await getValidAccessToken();
    if (token) {
      try {
        const res = await callGemini(taskType, title, description, {
          accessToken: token,
          quotaProjectId: GOOGLE_CLOUD_PROJECT_ID || undefined,
        });
        res._provider = "gemini-oauth";
        res._model = GEMINI_MODEL;
        return res;
      } catch (err: any) {
        return fallback(
          taskType,
          title,
          description,
          `Google 登录调用 Gemini 失败（${err.message}），已回退本地引擎`
        );
      }
    }
    return fallback(
      taskType,
      title,
      description,
      "Google 授权未完成或已过期，请在设置页重新连接，当前已回退本地引擎"
    );
  }

  /* ② Gemini API Key */
  if (mode === "gemini-key") {
    const key = getCustomApiKey();
    if (key && key.trim()) {
      try {
        const res = await callGemini(taskType, title, description, {
          apiKey: key.trim(),
        });
        res._provider = "gemini-key";
        res._model = GEMINI_MODEL;
        return res;
      } catch (err: any) {
        return fallback(
          taskType,
          title,
          description,
          `Gemini API Key 调用失败（${err.message}），已回退本地引擎`
        );
      }
    }
    return fallback(
      taskType,
      title,
      description,
      "未配置 Gemini API Key，已回退本地引擎"
    );
  }

  /* ③ 后端 FastAPI */
  if (canUseApi()) {
    try {
      const res = await callApiAnalysis(taskType, title, description);
      res._provider = "api";
      res._model = "backend-llm";
      return res;
    } catch (err: any) {
      return fallback(
        taskType,
        title,
        description,
        `后端 AI 引擎连接失败（${err.message}），已回退本地引擎`
      );
    }
  }

  /* ④ 本地规则引擎（默认 / 兜底） */
  return fallback(taskType, title, description);
}
