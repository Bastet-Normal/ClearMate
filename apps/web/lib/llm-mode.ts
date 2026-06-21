/**
 * LLM 模式管理
 * 
 * 两种模式：
 * - "local"（默认）：浏览器内 mock-analysis，纯前端，无需后端
 * - "api"：调用后端 FastAPI，后端代理真实 LLM API Key
 * 
 * 模式存储在 localStorage，用户可在设置中切换。
 */

export type LLMMode = "local" | "api";

const STORAGE_KEY = "cm_llm_mode";
const API_URL_KEY = "cm_api_url";

export function getLLMMode(): LLMMode {
  if (typeof window === "undefined") return "local";
  return (localStorage.getItem(STORAGE_KEY) as LLMMode) || "local";
}

export function setLLMMode(mode: LLMMode) {
  localStorage.setItem(STORAGE_KEY, mode);
}

export function getApiUrl(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(API_URL_KEY) || "http://localhost:8000";
}

export function setApiUrl(url: string) {
  localStorage.setItem(API_URL_KEY, url);
}

export function isApiMode(): boolean {
  return getLLMMode() === "api";
}
