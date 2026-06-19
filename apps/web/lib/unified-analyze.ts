/**
 * 统一分析入口
 * 
 * 根据 LLM 模式选择：
 * - local：浏览器内 mock-analysis
 * - api：调用后端 FastAPI（后端代理真实 LLM）
 */

import { analyzeTask as mockAnalyzeTask } from "./mock-analysis";
import type { AnalysisResult } from "@/types";
import { getLLMMode, getApiUrl } from "./llm-mode";

// 动态 import api-client（仅 api 模式需要）
async function callApiAnalysis(
  taskType: string,
  title: string,
  description: string
): Promise<AnalysisResult> {
  // 动态 import 避免在 local 模式下加载 axios
  const { apiCreateTask, apiCreateAnalysis, apiGetLatestAnalysis } = await import("./api-client");
  
  // 1. 创建任务
  const task = await apiCreateTask({ title, task_type: taskType, description });
  
  // 2. 触发分析
  const analysis = await apiCreateAnalysis(task.id);
  
  // 3. 返回 result_json（后端返回的已经是结构化数据）
  return analysis.result_json as unknown as AnalysisResult;
}

/**
 * 统一分析函数
 * - local 模式：浏览器内 mock-analysis（零延迟，加进度模拟由 analyze-progress.ts 处理）
 * - api 模式：调用后端 FastAPI → 真实 LLM
 */
export async function unifiedAnalyze(
  taskType: string,
  title: string,
  description: string
): Promise<AnalysisResult> {
  const mode = getLLMMode();
  
  if (mode === "api") {
    try {
      return await callApiAnalysis(taskType, title, description);
    } catch (err: any) {
      // API 调用失败时 fallback 到 local 模式
      console.warn("API 分析失败，回退到本地分析:", err.message);
      return mockAnalyzeTask(taskType, title, description);
    }
  }
  
  // local 模式
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
