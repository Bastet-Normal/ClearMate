/**
 * LLM 引擎模式管理
 *
 * 四种模式：
 * - "local"（默认）：浏览器内 mock-analysis，纯前端，无需后端/Key
 * - "gemini-oauth"：Google 登录后浏览器直连 Gemini（运营方额度，老人免 Key）
 * - "gemini-key"：用户自填 Gemini API Key，浏览器直连
 * - "api"：调用后端 FastAPI，后端代理真实 LLM
 *
 * 模式存储在 localStorage，用户可在设置中切换。
 */

export type LLMMode = "local" | "gemini-oauth" | "gemini-key" | "api";

const STORAGE_KEY = "cm_llm_mode";
const API_URL_KEY = "cm_api_url";
const GEMINI_KEY_STORAGE = "cm_custom_gemini_key";

function readItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function removeItem(key: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function getLLMMode(): LLMMode {
  if (typeof window === "undefined") return "local";
  const mode = readItem(STORAGE_KEY);
  return mode === "gemini-oauth" || mode === "gemini-key" || mode === "api" || mode === "local"
    ? mode
    : "local";
}

export function setLLMMode(mode: LLMMode) {
  writeItem(STORAGE_KEY, mode);
}

export function getApiUrl(): string {
  if (typeof window === "undefined") return "";
  const stored = readItem(API_URL_KEY);
  if (!stored) return "http://localhost:8000";
  try {
    return normalizeApiUrl(stored);
  } catch {
    removeItem(API_URL_KEY);
    return "http://localhost:8000";
  }
}

export function setApiUrl(url: string) {
  writeItem(API_URL_KEY, normalizeApiUrl(url));
}

export function normalizeApiUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("请输入有效的后端地址");
  }
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && localHosts.has(url.hostname))) {
    throw new Error("远程后端必须使用 HTTPS；HTTP 仅允许本机地址");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("后端地址不能包含账号、查询参数或片段");
  }
  return url.toString().replace(/\/$/, "");
}

export function isApiMode(): boolean {
  return getLLMMode() === "api";
}

/* ── Gemini API Key ── */
export function getGeminiApiKey(): string {
  if (typeof window === "undefined") return "";
  return readItem(GEMINI_KEY_STORAGE) || "";
}

export function setGeminiApiKey(key: string) {
  if (key) writeItem(GEMINI_KEY_STORAGE, key);
  else removeItem(GEMINI_KEY_STORAGE);
}
