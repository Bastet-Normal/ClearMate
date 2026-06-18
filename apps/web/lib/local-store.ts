/**客户端数据存储 — 用 localStorage 模拟后端数据库。

GitHub Pages 没有后端，所以所有数据存在浏览器本地。
数据结构与后端 API 返回格式一致，保证前端组件无感知切换。
*/

import type { Task, AnalysisResult } from "@/types";

const STORAGE_KEYS = {
  USER: "cm_user",
  TOKEN: "cm_token",
  TASKS: "cm_tasks",
  ANALYSES: "cm_analyses",
  FILES: "cm_files",
} as const;

// ---- User ----

export interface LocalUser {
  id: number;
  email: string;
  nickname: string;
  member_mode: string;
  is_active: boolean;
  created_at: string;
}

export function getStoredUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user: LocalUser | null) {
  if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEYS.USER);
}

export function isLoggedIn(): boolean {
  return !!getStoredUser() && !!localStorage.getItem(STORAGE_KEYS.TOKEN);
}

export function logout() {
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
}

// ---- Tasks ----

interface StoredTask extends Task {
  user_id: number;
}

function getTasks(): StoredTask[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
  return raw ? JSON.parse(raw) : [];
}

function saveTasks(tasks: StoredTask[]) {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}

export function getUserTasks(): Task[] {
  const user = getStoredUser();
  if (!user) return [];
  return getTasks().filter((t) => t.user_id === user.id);
}

export function createTask(data: {
  title: string;
  task_type: string;
  description?: string;
}): Task {
  const user = getStoredUser();
  if (!user) throw new Error("未登录");

  const tasks = getTasks();
  const numericId = tasks.length > 0 ? Math.max(...tasks.map((t) => Number(t.id) || 0)) + 1 : 1;
  const id = String(numericId);
  const now = new Date().toISOString();

  const task: StoredTask = {
    id: String(id),
    user_id: user.id,
    title: data.title,
    task_type: data.task_type as Task["task_type"],
    status: "draft",
    risk_level: null,
    description: data.description || "",
    deadline_at: null,
    reminder_at: null,
    created_at: now,
    updated_at: now,
  };

  tasks.push(task);
  saveTasks(tasks);
  return task;
}

export function getTask(taskId: string): Task | null {
  const user = getStoredUser();
  if (!user) return null;
  return getTasks().find((t) => t.id === taskId && t.user_id === user.id) || null;
}

export function updateTask(
  taskId: string,
  data: Partial<Pick<Task, "status" | "risk_level" | "title" | "description">>
): Task | null {
  const user = getStoredUser();
  if (!user) return null;

  const tasks = getTasks();
  const idx = tasks.findIndex((t) => t.id === taskId && t.user_id === user.id);
  if (idx === -1) return null;

  const task = tasks[idx];
  if (data.status !== undefined) task.status = data.status;
  if (data.risk_level !== undefined) task.risk_level = data.risk_level;
  if (data.title !== undefined) task.title = data.title;
  if (data.description !== undefined) task.description = data.description;
  task.updated_at = new Date().toISOString();

  tasks[idx] = task;
  saveTasks(tasks);
  return task;
}

export function deleteTask(taskId: string): boolean {
  const user = getStoredUser();
  if (!user) return false;

  const tasks = getTasks();
  const idx = tasks.findIndex((t) => t.id === taskId && t.user_id === user.id);
  if (idx === -1) return false;

  tasks.splice(idx, 1);
  saveTasks(tasks);

  // 同时删除关联的分析
  const analyses = getAnalyses().filter((a) => a.task_id !== taskId);
  saveAnalyses(analyses);

  return true;
}

// ---- Analyses ----

export interface StoredAnalysis {
  id: number;
  task_id: string;
  provider: string;
  model: string;
  risk_level: string;
  result_json: AnalysisResult;
  created_at: string;
}

function getAnalyses(): StoredAnalysis[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEYS.ANALYSES);
  return raw ? JSON.parse(raw) : [];
}

function saveAnalyses(analyses: StoredAnalysis[]) {
  localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(analyses));
}

export function getTaskAnalyses(taskId: string): StoredAnalysis[] {
  return getAnalyses().filter((a) => a.task_id === taskId);
}

export function getLatestAnalysis(taskId: string): StoredAnalysis | null {
  const analyses = getAnalyses()
    .filter((a) => a.task_id === taskId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return analyses[0] || null;
}

export function saveAnalysis(taskId: string, result: AnalysisResult): StoredAnalysis {
  const analyses = getAnalyses();
  const id = analyses.length > 0 ? Math.max(...analyses.map((a) => a.id)) + 1 : 1;

  const analysis: StoredAnalysis = {
    id,
    task_id: taskId,
    provider: "client-mock",
    model: "client-v1",
    risk_level: result.risk_level,
    result_json: result,
    created_at: new Date().toISOString(),
  };

  analyses.push(analysis);
  saveAnalyses(analyses);

  // 同步更新 task 的 risk_level
  updateTask(taskId, { risk_level: result.risk_level });

  return analysis;
}

// ---- Auth (模拟) ----

export function register(data: {
  email: string;
  nickname: string;
  password: string;
}): { token: string; user: LocalUser } {
  // 检查是否已注册
  const users = getStoredUsers();
  if (users.find((u) => u.email === data.email)) {
    throw new Error("该邮箱已注册");
  }

  const id = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  const user: LocalUser = {
    id,
    email: data.email,
    nickname: data.nickname,
    member_mode: "normal",
    is_active: true,
    created_at: new Date().toISOString(),
  };

  // 存密码（仅本地演示，不安全但 GitHub Pages 无后端）
  const userWithPw = { ...user, password: data.password };
  users.push(userWithPw);
  saveStoredUsers(users);

  const token = `local-token-${id}-${Date.now()}`;
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  setStoredUser(user);

  return { token, user };
}

export function login(data: {
  email: string;
  password: string;
}): { token: string; user: LocalUser } {
  const users = getStoredUsers();
  const found = users.find((u) => u.email === data.email);
  if (!found || found.password !== data.password) {
    throw new Error("邮箱或密码错误");
  }
  if (!found.is_active) {
    throw new Error("账号已被禁用");
  }

  const user: LocalUser = {
    id: found.id,
    email: found.email,
    nickname: found.nickname,
    member_mode: found.member_mode,
    is_active: found.is_active,
    created_at: found.created_at,
  };

  const token = `local-token-${user.id}-${Date.now()}`;
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  setStoredUser(user);

  return { token, user };
}

// Internal: user list with passwords
interface StoredUserWithPw extends LocalUser {
  password: string;
}

function getStoredUsers(): StoredUserWithPw[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("cm_users_with_pw");
  return raw ? JSON.parse(raw) : [];
}

function saveStoredUsers(users: StoredUserWithPw[]) {
  localStorage.setItem("cm_users_with_pw", JSON.stringify(users));
}

// ---- Stats (Dashboard 用) ----

export function getStats() {
  const tasks = getUserTasks();
  const analyses = getAnalyses();
  const user = getStoredUser();

  const totalTasks = tasks.length;
  const highRiskTasks = tasks.filter(
    (t) => t.risk_level === "high" || t.risk_level === "critical"
  ).length;
  const pendingTasks = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "archived"
  ).length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const totalAnalyses = analyses.filter((a) =>
    tasks.some((t) => t.id === a.task_id)
  ).length;

  // 最近 7 天创建的任务数
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentTasks = tasks.filter(
    (t) => new Date(t.created_at) >= sevenDaysAgo
  ).length;

  return {
    totalTasks,
    highRiskTasks,
    pendingTasks,
    completedTasks,
    totalAnalyses,
    recentTasks,
    nickname: user?.nickname || "用户",
  };
}
