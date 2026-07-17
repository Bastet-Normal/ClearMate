"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ShieldCheck, LayoutDashboard, ListTodo, ScanSearch, BookOpen,
  Settings, LogOut, Sun, Moon, Menu, X, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStoredUser, isLoggedIn, logout as doLogout, setStoredUser, syncElderModeToAccount } from "@/lib/local-store";
import { safeGetItem, safeSetItem } from "@/lib/client-storage";
import { useTheme } from "@/lib/use-theme";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "看板",   icon: LayoutDashboard },
  { href: "/tasks",      label: "我的任务", icon: ListTodo },
  { href: "/self-check", label: "风险自检", icon: ScanSearch },
  { href: "/avoid-pit",  label: "避坑指南", icon: BookOpen },
];

export function Header() {
  const router   = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [loggedIn,  setLoggedIn]  = useState(false);
  const [nickname,  setNickname]  = useState("");
  const [isElder,   setIsElder]   = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled]   = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const syncAuth = () => {
      const u = getStoredUser();
      setLoggedIn(isLoggedIn());
      setNickname(u?.nickname || "");
      const elderPref = safeGetItem("cm_elder_mode");
      setIsElder(elderPref === "elder" || u?.member_mode === "elder");
    };
    syncAuth();

    const handleModeChange = (e: Event) => {
      setIsElder(!!(e as CustomEvent).detail?.isElder);
    };
    const handleUnauth = () => {
      setLoggedIn(false); setNickname("");
      router.push("/login");
    };
    window.addEventListener("cm:elder-mode-change", handleModeChange);
    window.addEventListener("cm:unauthorized",      handleUnauth);
    window.addEventListener("cm:auth-change",       syncAuth);
    return () => {
      window.removeEventListener("cm:elder-mode-change", handleModeChange);
      window.removeEventListener("cm:unauthorized",      handleUnauth);
      window.removeEventListener("cm:auth-change",       syncAuth);
    };
  }, [router]);

  useEffect(() => { setMenuOpen(false); setUserMenuOpen(false); }, [pathname]);

  const handleLogout = useCallback(async () => {
    await doLogout(); setLoggedIn(false); setNickname(""); router.push("/");
  }, [router]);

  const toggleElderMode = useCallback(() => {
    const next = !isElder;
    setIsElder(next);
    safeSetItem("cm_elder_mode", next ? "elder" : "normal");
    const user = getStoredUser();
    if (user) setStoredUser({ ...user, member_mode: next ? "elder" : "normal" });
    syncElderModeToAccount(next);
    window.dispatchEvent(new CustomEvent("cm:elder-mode-change", { detail: { isElder: next } }));
  }, [isElder]);

  return (
    <>
      <header className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 border-b",
        scrolled ? "backdrop-blur-xl shadow-sm" : "backdrop-blur-md"
      )} style={{
        background: scrolled ? "rgb(var(--bg-0) / 0.9)" : "rgb(var(--bg-0) / 0.7)",
        borderColor: "rgb(var(--border))",
      }}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              "bg-gradient-to-br from-brand-500 to-brand-600",
              "shadow-md shadow-brand-500/25 group-hover:shadow-lg group-hover:shadow-brand-500/35",
              "transition-all duration-200 group-hover:scale-105"
            )}>
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-black tracking-tight text-gradient-brand">
                ClearMate
              </span>
              <span className="ml-1.5 text-xs font-semibold text-fg-faint">
                明鉴
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href} className={cn(
                  "relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  active
                    ? "text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40"
                    : "text-fg-muted hover:text-fg-primary hover:bg-surface-2"
                )}>
                  <Icon className="h-4 w-4" />
                  {label}
                  {active && (
                    <span className="absolute -bottom-px left-2 right-2 h-0.5 rounded-full bg-brand-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 text-fg-muted hover:bg-surface-2 hover:text-fg-primary"
              title={isDark ? "切换亮色模式" : "切换暗色模式"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Elder mode toggle */}
            <button
              onClick={toggleElderMode}
              aria-label={isElder ? "切换标准模式" : "切换老人模式"}
              className={cn(
                "hidden sm:flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 text-base",
                isElder
                  ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                  : "text-fg-muted hover:bg-surface-2"
              )}
              title={isElder ? "切换标准模式" : "切换老人模式"}
            >
              {isElder ? "🔤" : "👴"}
            </button>

            {loggedIn ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-all duration-150",
                    "text-fg-secondary hover:bg-surface-2",
                    userMenuOpen && "bg-surface-2"
                  )}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xs font-bold">
                    {nickname.charAt(0) || "U"}
                  </div>
                  <span className="text-sm font-medium max-w-[80px] truncate">{nickname}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-fg-faint transition-transform", userMenuOpen && "rotate-180")} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border py-1.5 shadow-xl animate-slide-up-fade"
                    style={{ background: "rgb(var(--bg-0))", borderColor: "rgb(var(--border))" }}>
                    <Link href="/settings" className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-fg-secondary hover:bg-surface-1 transition-colors">
                      <Settings className="h-4 w-4 text-fg-faint" /> 设置
                    </Link>
                    <div className="my-1 border-t border-border" />
                    <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                      <LogOut className="h-4 w-4" /> 退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login" className="btn btn-sm btn-ghost text-fg-muted">登录</Link>
                <Link href="/register" className="btn btn-sm btn-primary">免费注册</Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label={menuOpen ? "关闭导航菜单" : "打开导航菜单"}
              aria-expanded={menuOpen}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-2 transition-all"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {menuOpen && (
          <div className="md:hidden border-t px-4 py-3 space-y-1 animate-fade-in-down" style={{ background: "rgb(var(--bg-0))", borderColor: "rgb(var(--border))" }}>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href} className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300"
                    : "text-fg-secondary hover:bg-surface-1"
                )}>
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              );
            })}

            <div className="border-t border-border pt-2 mt-2 space-y-1">
              <button onClick={toggleElderMode} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-fg-secondary hover:bg-surface-1">
                <span>{isElder ? "🔤" : "👴"}</span>
                {isElder ? "切换标准模式" : "切换老人模式"}
              </button>
              <button onClick={toggleTheme} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-fg-secondary hover:bg-surface-1">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? "切换亮色模式" : "切换暗色模式"}
              </button>

              {loggedIn ? (
                <>
                  <Link href="/settings" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-fg-secondary hover:bg-surface-1">
                    <Settings className="h-4 w-4" /> 设置
                  </Link>
                  <button onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <LogOut className="h-4 w-4" /> 退出登录
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-1">
                  <Link href="/login"    className="flex-1 btn btn-sm btn-outline justify-center">登录</Link>
                  <Link href="/register" className="flex-1 btn btn-sm btn-primary justify-center">注册</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Click-outside to close user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </>
  );
}
