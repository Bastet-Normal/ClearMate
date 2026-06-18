"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredUser, isLoggedIn, logout as doLogout } from "@/lib/local-store";

export function Header() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const user = getStoredUser();
    if (user) setNickname(user.nickname);
  }, []);

  function handleLogout() {
    doLogout();
    setLoggedIn(false);
    setNickname("");
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">
            C
          </div>
          <span className="text-xl font-bold text-gray-900">ClearMate</span>
        </Link>
        <nav className="flex items-center gap-4">
          {loggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors"
              >
                仪表盘
              </Link>
              <Link
                href="/tasks"
                className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors"
              >
                我的任务
              </Link>
              <span className="text-sm text-gray-500">{nickname}</span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors"
              >
                退出
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                注册
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
