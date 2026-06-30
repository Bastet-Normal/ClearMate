/**客户端数据存储 — 用 localStorage 模拟后端数据库。

GitHub Pages 没有后端，所以所有数据存在浏览器本地。
数据结构与后端 API 返回格式一致，保证前端组件无感知切换。
*/

import type { Task, AnalysisResult } from "@/types";
import { supabase, isSupabaseConfigured } from "./supabase";

const STORAGE_KEYS = {
  USER: "cm_user",
  TOKEN: "cm_token",
  TASKS: "cm_tasks",
  ANALYSES: "cm_analyses",
  FILES: "cm_files",
} as const;

function getStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageItem(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeStorageItem(key: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

function getJsonItem<T>(key: string, fallback: T): T {
  const raw = getStorageItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setJsonItem(key: string, value: unknown): boolean {
  try {
    return setStorageItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

// ---- Simple hash (prevent plaintext passwords in localStorage) ----

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return "h_" + Math.abs(hash).toString(36);
}

/** 通知 Header 等持久组件刷新登录态（登录/注册/登出/会话恢复后触发） */
function emitAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cm:auth-change"));
  }
}

/**
 * 登录/会话恢复时：若本机尚未设置老人模式偏好，则采用账号上的偏好，
 * 让老人在新设备登录即自动进入老人模式。本机已显式设置则不覆盖。
 */
function adoptAccountElderPref(user: any) {
  if (typeof window === "undefined") return;
  const accPref = user?.user_metadata?.member_mode;
  if (accPref !== "elder" && accPref !== "normal") return;
  if (getStorageItem("cm_elder_mode") === null) {
    setStorageItem("cm_elder_mode", accPref);
    window.dispatchEvent(new CustomEvent("cm:elder-mode-change", { detail: { isElder: accPref === "elder" } }));
  }
}

/** 把老人模式偏好写穿到 Supabase 账号（fire-and-forget，失败不影响本地） */
export function syncElderModeToAccount(isElder: boolean) {
  if (!isSupabaseConfigured() || !supabase) return;
  supabase.auth
    .updateUser({ data: { member_mode: isElder ? "elder" : "normal" } })
    .catch(() => {});
}

// ---- User ----

export interface LocalUser {
  id: string;
  email: string;
  nickname: string;
  member_mode: string;
  is_active: boolean;
  created_at: string;
}

export function getStoredUser(): LocalUser | null {
  return getJsonItem<LocalUser | null>(STORAGE_KEYS.USER, null);
}

export function setStoredUser(user: LocalUser | null) {
  if (user) setJsonItem(STORAGE_KEYS.USER, user);
  else removeStorageItem(STORAGE_KEYS.USER);
}

export interface UserProfile {
  real_name: string;
  phone: string;
}

export function getStoredProfile(): UserProfile {
  return getJsonItem<UserProfile>("cm_user_profile", { real_name: "", phone: "" });
}

export function setStoredProfile(profile: UserProfile) {
  setJsonItem("cm_user_profile", profile);
}

export function isLoggedIn(): boolean {
  return !!getStoredUser() && !!getStorageItem(STORAGE_KEYS.TOKEN);
}

// ---- Tasks ----

interface StoredTask extends Task {
  user_id: string;
}

function getTasks(): StoredTask[] {
  return getJsonItem<StoredTask[]>(STORAGE_KEYS.TASKS, []);
}

function saveTasks(tasks: StoredTask[]) {
  setJsonItem(STORAGE_KEYS.TASKS, tasks);
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
  return getJsonItem<StoredAnalysis[]>(STORAGE_KEYS.ANALYSES, []);
}

function saveAnalyses(analyses: StoredAnalysis[]) {
  setJsonItem(STORAGE_KEYS.ANALYSES, analyses);
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

export function saveAnalysis(
  taskId: string,
  result: AnalysisResult,
  provider?: string,
  model?: string
): StoredAnalysis {
  const analyses = getAnalyses();
  const id = analyses.length > 0 ? Math.max(...analyses.map((a) => a.id)) + 1 : 1;

  const analysis: StoredAnalysis = {
    id,
    task_id: taskId,
    provider: provider || "client-mock",
    model: model || "client-v1",
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

// ---- Auth ----
// Supabase 已配置 → 真实账号托管；否则回退本地模拟账号。

/** Supabase user → 本地 LocalUser 镜像 */
function mapSupabaseUser(u: any): LocalUser {
  const elder =
    typeof window !== "undefined" &&
    getStorageItem("cm_elder_mode") === "elder";
  return {
    id: String(u.id),
    email: u.email || "",
    nickname: u.user_metadata?.nickname || (u.email ? u.email.split("@")[0] : "用户"),
    member_mode: elder ? "elder" : "normal",
    is_active: true,
    created_at: u.created_at || new Date().toISOString(),
  };
}

/** Supabase 鉴权错误信息翻成中文 */
function translateSupabaseError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("user already registered")) return "该邮箱已注册";
  if (m.includes("invalid login credentials") || m.includes("invalid credentials"))
    return "邮箱或密码错误";
  if (m.includes("email not confirmed")) return "邮箱尚未确认，请先到邮箱点击确认链接";
  if (m.includes("password") && m.includes("weak")) return "密码太弱（至少 6 位）";
  if (m.includes("rate limit")) return "操作过于频繁，请稍后再试";
  return msg;
}

/**
 * 订阅 Supabase 鉴权状态，把当前用户镜像到 cm_user / cm_token，
 * 供各页面同步读取（isLoggedIn / getStoredUser）。AuthProvider 挂载时调用一次。
 */
export function initAuthMirror(): (() => void) | undefined {
  if (!isSupabaseConfigured() || !supabase) return undefined;
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      adoptAccountElderPref(session.user);
      setStoredUser(mapSupabaseUser(session.user));
      setStorageItem(STORAGE_KEYS.TOKEN, session.access_token);
    } else {
      setStoredUser(null);
      removeStorageItem(STORAGE_KEYS.TOKEN);
    }
    emitAuthChange();
  });
  return () => data.subscription.unsubscribe();
}

export async function register(data: {
  email: string;
  nickname: string;
  password: string;
}): Promise<{ token: string; user: LocalUser }> {
  // ── Supabase 真实账号 ──
  if (isSupabaseConfigured() && supabase) {
    const { data: res, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { nickname: data.nickname } },
    });
    if (error) throw new Error(translateSupabaseError(error.message));
    // 未返回 session → 多半是开启了「邮箱确认」
    if (!res.session) {
      throw new Error("注册成功，请到邮箱点击确认链接完成激活后再登录");
    }
    const user = mapSupabaseUser(res.user);
    setStoredUser(user);
    setStorageItem(STORAGE_KEYS.TOKEN, res.session.access_token);
    emitAuthChange();
    return { token: res.session.access_token, user };
  }

  // ── 本地兜底 ──
  const users = getStoredUsers();
  if (users.find((u) => u.email === data.email)) {
    throw new Error("该邮箱已注册");
  }
  const numericId =
    users.length > 0 ? Math.max(...users.map((u) => Number(u.id) || 0)) + 1 : 1;
  const user: LocalUser = {
    id: String(numericId),
    email: data.email,
    nickname: data.nickname,
    member_mode: "normal",
    is_active: true,
    created_at: new Date().toISOString(),
  };
  const userWithPw = { ...user, password: simpleHash(data.password) };
  users.push(userWithPw);
  saveStoredUsers(users);
  const token = `local-token-${user.id}-${Date.now()}`;
  setStorageItem(STORAGE_KEYS.TOKEN, token);
  setStoredUser(user);
  emitAuthChange();
  return { token, user };
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<{ token: string; user: LocalUser }> {
  if (isSupabaseConfigured() && supabase) {
    const { data: res, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) throw new Error(translateSupabaseError(error.message));
    const user = mapSupabaseUser(res.user);
    setStoredUser(user);
    setStorageItem(STORAGE_KEYS.TOKEN, res.session.access_token);
    emitAuthChange();
    return { token: res.session.access_token, user };
  }

  // 本地兜底
  const users = getStoredUsers();
  const found = users.find((u) => u.email === data.email);
  if (!found || found.password !== simpleHash(data.password)) {
    throw new Error("邮箱或密码错误");
  }
  if (!found.is_active) throw new Error("账号已被禁用");
  const user: LocalUser = {
    id: found.id,
    email: found.email,
    nickname: found.nickname,
    member_mode: found.member_mode,
    is_active: found.is_active,
    created_at: found.created_at,
  };
  const token = `local-token-${user.id}-${Date.now()}`;
  setStorageItem(STORAGE_KEYS.TOKEN, token);
  setStoredUser(user);
  emitAuthChange();
  return { token, user };
}

export async function logout() {
  if (isSupabaseConfigured() && supabase) {
    try { await supabase.auth.signOut(); } catch {}
  }
  setStoredUser(null);
  removeStorageItem(STORAGE_KEYS.TOKEN);
  emitAuthChange();
}

// Internal: 本地兜底用用户表（含密码哈希）
interface StoredUserWithPw extends LocalUser {
  password: string;
}

function getStoredUsers(): StoredUserWithPw[] {
  return getJsonItem<StoredUserWithPw[]>("cm_users_with_pw", []);
}

function saveStoredUsers(users: StoredUserWithPw[]) {
  setJsonItem("cm_users_with_pw", users);
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
