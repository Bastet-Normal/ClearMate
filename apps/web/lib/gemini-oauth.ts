/**
 * Google OAuth（浏览器端 · GIS token client）— 用于直连 Gemini API 的实验通道
 *
 * 运营方需在 GCP 控制台：
 *   1. 新建/选用一个 GCP 项目，开通「Generative Language API」；
 *   2. 创建一个 OAuth 2.0 Client ID（类型：Web application），
 *      把部署域名（含本地 http://localhost:3001）加入 Authorized JavaScript origins；
 *   3. 把该 Client ID 写入环境变量 NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID。
 *   4. 如需按官方 REST 示例显式指定 quota project，可配置
 *      NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID，并确保 Google Cloud/IAM 配置允许。
 *
 * 用户点「连接 Google」→ GIS 弹窗同意 → 拿到短期 access_token →
 * 前端带 Authorization: Bearer 直连 generativelanguage.googleapis.com。
 *
 * 注意：Google 的 Web token model 要求 access token 过期后通过用户手势重新获取。
 * 这里不做后台静默续期，也不把 token 持久化到 localStorage，避免备份导出泄漏。
 */

declare global {
  interface Window {
    google?: any;
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID || "";
export const GOOGLE_CLOUD_PROJECT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID || "";
// ⚠️ 作用域说明：
// Google 对 Web 端的 Generative Language API OAuth 只开放了两个敏感子作用域——
//   .retriever（语义检索）与 .tuning（模型微调），通用的 .../auth/generative-language
//   不在可授权列表，传了会报 invalid_scope。官方 OAuth quickstart 当前示例使用
//   cloud-platform + generative-language.retriever；Web 端是否允许 generateContent
//   取决于 Google 当前策略和项目/IAM/quota 配置，失败时统一回退本地引擎。
const SCOPE =
  "openid https://www.googleapis.com/auth/userinfo.email " +
  "https://www.googleapis.com/auth/cloud-platform " +
  "https://www.googleapis.com/auth/generative-language.retriever";
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

const TOKEN_KEY = "cm_gemini_oauth_token";

interface StoredToken {
  access_token: string;
  expires_at: number; // ms timestamp
  email?: string;
}

export function isOAuthConfigured(): boolean {
  return !!CLIENT_ID;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function clearLegacyPersistentToken() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

function loadToken(): StoredToken | null {
  if (!isBrowser()) return null;
  clearLegacyPersistentToken();
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as StoredToken) : null;
  } catch {
    return null;
  }
}

function saveToken(t: StoredToken | null) {
  if (!isBrowser()) return;
  clearLegacyPersistentToken();
  try {
    if (!t) sessionStorage.removeItem(TOKEN_KEY);
    else sessionStorage.setItem(TOKEN_KEY, JSON.stringify(t));
  } catch {}
}

let gsiPromise: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (!isBrowser()) return Promise.reject(new Error("非浏览器环境"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("加载 Google 登录脚本失败"));
    document.head.appendChild(s);
  });
  return gsiPromise;
}

export interface OAuthStatus {
  active: boolean;
  email?: string;
}

/** 当前登录状态（token 未过期视为活跃） */
export function getOAuthStatus(): OAuthStatus {
  const t = loadToken();
  if (!t) return { active: false };
  return { active: Date.now() < t.expires_at - 60_000, email: t.email };
}

/**
 * 返回有效 access_token：
 * - 仍在有效期 → 直接返回；
 * - 已过期/未登录 → 返回 null，等待用户在设置页重新点击连接。
 */
export async function getValidAccessToken(): Promise<string | null> {
  const t = loadToken();
  if (!t) return null;
  if (Date.now() < t.expires_at - 60_000) return t.access_token;
  saveToken(null);
  return null;
}

/** 发起 Google 授权（弹窗同意，必须由用户点击触发） */
export async function loginWithGoogle(): Promise<void> {
  if (!CLIENT_ID) {
    throw new Error("运营方未配置 Google 登录（缺少 NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID）");
  }
  await loadGsi();
  await requestToken({ prompt: "consent" });
}

function requestToken(opts: { prompt: string }): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: async (resp: any) => {
        if (resp.error) {
          const desc = resp.error_description || "";
          reject(new Error(`${resp.error}${desc ? `：${desc}` : ""}`));
          return;
        }
        const access_token = resp.access_token;
        const expires_at =
          Date.now() + (Number(resp.expires_in) || 3600) * 1000;
        // 拉取邮箱用于展示
        let email: string | undefined;
        try {
          const ui = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            { headers: { Authorization: `Bearer ${access_token}` } }
          );
          if (ui.ok) email = (await ui.json()).email;
        } catch {}
        saveToken({ access_token, expires_at, email });
        resolve();
      },
      error_callback: (err: any) => {
        reject(new Error(err?.message || "Google 登录失败"));
      },
    });
    client.requestAccessToken({ prompt: opts.prompt });
  });
}

/** 退出登录：撤销 token 并清除本地凭据 */
export function logoutGoogle() {
  const t = loadToken();
  if (t?.access_token && window.google?.accounts?.oauth2) {
    try {
      window.google.accounts.oauth2.revoke(t.access_token, () => {});
    } catch {}
  }
  saveToken(null);
}
