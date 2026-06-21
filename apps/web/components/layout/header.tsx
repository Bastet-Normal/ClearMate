"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredUser, isLoggedIn, logout as doLogout, setStoredUser } from "@/lib/local-store";

export function Header() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isElder, setIsElder] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const elderPref = localStorage.getItem("cm_elder_mode");
    const user = getStoredUser();
    const activeElder = elderPref === "elder" || user?.member_mode === "elder";
    setIsElder(activeElder);

    if (user) {
      setNickname(user.nickname);
    }

    const handleModeChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsElder(!!customEvent.detail?.isElder);
    };

    window.addEventListener("cm:elder-mode-change", handleModeChange);

    function handleUnauthorized() {
      setLoggedIn(false);
      setNickname("");
      router.push("/login");
    }
    window.addEventListener("cm:unauthorized", handleUnauthorized);
    
    return () => {
      window.removeEventListener("cm:elder-mode-change", handleModeChange);
      window.removeEventListener("cm:unauthorized", handleUnauthorized);
    };
  }, [router]);

  function handleLogout() {
    doLogout();
    setLoggedIn(false);
    setNickname("");
    router.push("/");
  }

  function toggleElderMode() {
    const newMode = isElder ? "normal" : "elder";
    const nextIsElder = newMode === "elder";
    setIsElder(nextIsElder);
    localStorage.setItem("cm_elder_mode", newMode);
    const user = getStoredUser();
    if (user) setStoredUser({ ...user, member_mode: newMode });

    // Dispatch global event
    window.dispatchEvent(new CustomEvent("cm:elder-mode-change", { detail: { isElder: nextIsElder } }));
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-md shadow-brand-500/20">
            C
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
            ClearMate
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {loggedIn ? (
            <>
              <NavLink href="/dashboard">仪表盘</NavLink>
              <NavLink href="/tasks">我的任务</NavLink>
              <NavLink href="/self-check">风险自检</NavLink>
              <NavLink href="/settings">设置</NavLink>
              <div className="mx-2 h-5 w-px bg-slate-200" />
              <button onClick={toggleElderMode} className="rounded-lg p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all" title={isElder ? "标准模式" : "老人模式"}>
                {isElder ? "🔤" : "👴"}
              </button>
              <span className="ml-1 text-sm font-medium text-slate-600">{nickname}</span>
              <button onClick={handleLogout} className="ml-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all">
                退出
              </button>
            </>
          ) : (
            <>
              <NavLink href="/login">登录</NavLink>
              <Link href="/register" className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold">
                免费注册
              </Link>
            </>
          )}
        </nav>

        <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="sm:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-2">
          {loggedIn ? (
            <>
              <MobileLink href="/dashboard" onClick={() => setMenuOpen(false)}>仪表盘</MobileLink>
              <MobileLink href="/tasks" onClick={() => setMenuOpen(false)}>我的任务</MobileLink>
              <MobileLink href="/self-check" onClick={() => setMenuOpen(false)}>风险自检</MobileLink>
              <MobileLink href="/settings" onClick={() => setMenuOpen(false)}>设置</MobileLink>
              <button onClick={() => { toggleElderMode(); setMenuOpen(false); }} className="block w-full text-left rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                {isElder ? "🔤 标准模式" : "👴 老人模式"}
              </button>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block w-full text-left rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                退出登录
              </button>
            </>
          ) : (
            <>
              <MobileLink href="/login" onClick={() => setMenuOpen(false)}>登录</MobileLink>
              <MobileLink href="/register" onClick={() => setMenuOpen(false)}>注册</MobileLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-brand-700 hover:bg-slate-50 transition-all">
      {children}
    </Link>
  );
}

function MobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
      {children}
    </Link>
  );
}
