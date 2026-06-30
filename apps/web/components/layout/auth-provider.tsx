"use client";

import { useEffect } from "react";
import { initAuthMirror } from "@/lib/local-store";

/**
 * 挂载时订阅 Supabase 鉴权状态，把当前用户镜像到本地 cm_user / cm_token，
 * 使各页面现有的同步读取（isLoggedIn / getStoredUser）无需改造即可感知真实账号。
 * Supabase 未配置时 initAuthMirror 为空操作，仍用本地账号逻辑。
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    return initAuthMirror();
  }, []);

  return <>{children}</>;
}
