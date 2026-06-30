"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "./local-store";

/**
 * 受保护页面鉴权守卫：
 * - 挂载时若未登录 → 跳 /login
 * - 监听 cm:auth-change：登出 / 会话失效时自动跳转
 *
 * 用于 /dashboard、/tasks、/tasks/new、/tasks/detail。
 */
export function useRequireAuth() {
  const router = useRouter();
  useEffect(() => {
    const check = () => {
      if (!isLoggedIn()) router.replace("/login");
    };
    check();
    window.addEventListener("cm:auth-change", check);
    return () => window.removeEventListener("cm:auth-change", check);
  }, [router]);
}
