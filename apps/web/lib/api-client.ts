/**
 * 后端 API 调用层
 * 
 * 当 LLM 模式为 "api" 时，前端通过此模块调用后端 FastAPI。
 * 后端负责代理 LLM API Key，前端不接触密钥。
 */

import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// 请求拦截：附加 JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("cm_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截：401 跳登录
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("cm_token");
      localStorage.removeItem("cm_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ---- Auth ----

export async function apiLogin(email: string, password: string) {
  const res = await api.post("/api/v1/auth/login", { email, password });
  return res.data; // { access_token, token_type, user }
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
  const res = await api.put(`/api/v1/tasks/${taskId}`, data);
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
