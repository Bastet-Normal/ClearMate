/**
 * 后端 API 调用层
 * 
 * 当 LLM 模式为 "api" 时，前端通过此模块调用后端 FastAPI。
 * 后端负责代理 LLM API Key，前端不接触密钥。
 * 
 * API URL 从 localStorage 读取（设置页面可修改），
 * fallback 到 NEXT_PUBLIC_API_URL 环境变量。
 */

import axios from "axios";

function readLocalStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function removeLocalStorage(key: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

/** 获取当前 API base URL */
function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const stored = readLocalStorage("cm_api_url");
    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

/** 每次请求前动态设置 baseURL */
const api = axios.create({
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  if (typeof window !== "undefined") {
    const token = readLocalStorage("cm_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截：401 跳登录（用 router 而非 window.location）
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      removeLocalStorage("cm_token");
      removeLocalStorage("cm_user");
      // 用软跳转而非 window.location，basePath 下不会出错
      window.dispatchEvent(new CustomEvent("cm:unauthorized"));
    }
    return Promise.reject(error);
  }
);

// ---- Auth ----

export async function apiLogin(email: string, password: string) {
  const res = await api.post("/api/v1/auth/login", { email, password });
  return res.data;
}

export async function apiRegister(email: string, nickname: string, password: string) {
  const res = await api.post("/api/v1/auth/register", { email, nickname, password });
  return res.data;
}

// ---- Tasks ----

export async function apiCreateTask(data: { title: string; task_type: string; description?: string }) {
  const res = await api.post("/api/v1/tasks", data);
  return res.data;
}

export async function apiGetTasks() {
  const res = await api.get("/api/v1/tasks");
  return res.data;
}

export async function apiGetTask(taskId: number) {
  const res = await api.get(`/api/v1/tasks/${taskId}`);
  return res.data;
}

export async function apiUpdateTask(taskId: number, data: Record<string, unknown>) {
  const res = await api.patch(`/api/v1/tasks/${taskId}`, data);
  return res.data;
}

export async function apiDeleteTask(taskId: number) {
  await api.delete(`/api/v1/tasks/${taskId}`);
}

// ---- Analysis ----

export interface ApiAnalysisResult {
  id: number;
  task_id: number;
  provider: string;
  model: string;
  risk_level: string;
  result_json: Record<string, unknown>;
  tokens_used: number;
  created_at: string;
}

export async function apiCreateAnalysis(taskId: number): Promise<ApiAnalysisResult> {
  const res = await api.post(`/api/v1/tasks/${taskId}/analyses`);
  return res.data;
}

export async function apiGetAnalyses(taskId: number): Promise<ApiAnalysisResult[]> {
  const res = await api.get(`/api/v1/tasks/${taskId}/analyses`);
  return res.data;
}

export async function apiGetLatestAnalysis(taskId: number): Promise<ApiAnalysisResult> {
  const res = await api.get(`/api/v1/tasks/${taskId}/analyses/latest`);
  return res.data;
}

// ---- Health ----

export async function apiHealthCheck(): Promise<boolean> {
  try {
    const res = await api.get("/health");
    return res.data?.status === "ok";
  } catch {
    return false;
  }
}
