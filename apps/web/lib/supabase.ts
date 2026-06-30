/**
 * Supabase 客户端 — 纯前端直连（anon key 公开，靠 RLS 保护）
 *
 * 仅用于「账号托管」：注册/登录/登出/会话恢复走 Supabase Auth。
 * 任务与诊断数据仍存浏览器本地（localStorage）。
 *
 * 运营方在 apps/web/.env.local 配置：
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
 * 未配置时 isSupabaseConfigured()=false，auth 自动回退到本地账号逻辑。
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function isSupabaseConfigured(): boolean {
  return !!(URL && ANON_KEY);
}

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(URL, ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
