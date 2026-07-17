"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, ShieldCheck, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { login } from "@/lib/local-store";
import { FormField, Input } from "@/components/ui/form";

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "邮箱或密码不正确");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 page-bg">
      <div className="w-full max-w-md animate-fade-in-up">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-xl shadow-brand-500/25">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-fg-primary">欢迎回来</h1>
          <p className="mt-1.5 text-sm text-fg-muted">登录 ClearMate 账号</p>
        </div>

        {/* Card */}
        <div className="card card-elevated rounded-3xl p-8 space-y-5">

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-800 p-3.5 animate-shake">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="邮箱地址" htmlFor="email">
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                leftIcon={<Mail className="h-4 w-4" />}
              />
            </FormField>

            <FormField label="密码" htmlFor="password">
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                leftIcon={<Lock className="h-4 w-4" />}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    aria-label={showPwd ? "隐藏密码" : "显示密码"}
                    className="text-fg-faint hover:text-fg-secondary transition-colors pointer-events-auto"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </FormField>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-lg btn-primary w-full mt-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  登录中...
                </>
              ) : (
                <>
                  登录
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-fg-faint" style={{ background: "rgb(var(--bg-0))" }}>或</span>
            </div>
          </div>

          {/* Register link */}
          <Link href="/register" className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border py-2.5 text-sm font-semibold text-fg-secondary hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950/30 dark:hover:border-brand-700 dark:hover:text-brand-400 transition-all duration-200">
            <Sparkles className="h-4 w-4" />
            免费注册账号
          </Link>
        </div>

        {/* Privacy note */}
        <p className="mt-5 text-center text-xs text-fg-faint">
          账号数据保存在您的浏览器本地，不会上传至云端 🔒
        </p>
      </div>
    </div>
  );
}
