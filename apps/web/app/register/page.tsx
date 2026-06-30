"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";
import { register } from "@/lib/local-store";
import { FormField, Input } from "@/components/ui/form";
import { cn } from "@/lib/utils";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "6位以上",    pass: password.length >= 6 },
    { label: "含数字",     pass: /\d/.test(password) },
    { label: "含字母",     pass: /[a-zA-Z]/.test(password) },
    { label: "含特殊字符", pass: /[^a-zA-Z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-amber-400", "bg-emerald-500"];
  const labels = ["弱", "一般", "中等", "强"];

  if (!password) return null;

  return (
    <div className="space-y-2 animate-fade-in">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              i < score ? colors[score - 1] : "bg-surface-3"
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {checks.map(({ label, pass }) => (
            <span key={label} className={cn(
              "text-xs transition-colors",
              pass ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-fg-faint"
            )}>
              {pass ? "✓" : "○"} {label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={cn("text-xs font-bold shrink-0 ml-2", colors[score - 1].replace("bg-", "text-"))}>
            {labels[score - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form,    setForm]    = useState({ email: "", nickname: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) { setError("密码长度至少 6 位"); return; }
    setLoading(true);
    try {
      await register(form);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "注册失败，请重试");
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
          <h1 className="text-2xl font-black text-fg-primary">创建账号</h1>
          <p className="mt-1.5 text-sm text-fg-muted">免费使用 ClearMate 全部功能</p>
        </div>

        <div className="card card-elevated rounded-3xl p-8 space-y-5">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-800 p-3.5 animate-shake">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="昵称" htmlFor="nickname">
              <Input
                id="nickname"
                type="text"
                required
                value={form.nickname}
                onChange={e => updateField("nickname", e.target.value)}
                placeholder="怎么称呼您？"
                leftIcon={<User className="h-4 w-4" />}
              />
            </FormField>

            <FormField label="邮箱地址" htmlFor="email">
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={e => updateField("email", e.target.value)}
                placeholder="your@email.com"
                leftIcon={<Mail className="h-4 w-4" />}
              />
            </FormField>

            <FormField label="密码" htmlFor="password">
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                value={form.password}
                onChange={e => updateField("password", e.target.value)}
                placeholder="至少 6 位"
                leftIcon={<Lock className="h-4 w-4" />}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="text-fg-faint hover:text-fg-secondary transition-colors pointer-events-auto"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <PasswordStrength password={form.password} />
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
                  注册中...
                </>
              ) : (
                <>
                  免费注册
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-fg-muted">
            已有账号？{" "}
            <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
              去登录
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-fg-faint">
          注册即表示您同意服务条款。账号数据仅保存在本地浏览器 🔒
        </p>
      </div>
    </div>
  );
}
