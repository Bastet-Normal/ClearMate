"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/local-store";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "登录 - ClearMate";
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try { login({ email, password }); router.push("/tasks"); }
    catch (err: any) { setError(err.message || "登录失败"); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-extrabold text-2xl shadow-xl shadow-brand-500/25">C</div>
          <h1 className="text-2xl font-bold text-slate-900">登录 ClearMate</h1>
          <p className="mt-2 text-sm text-slate-500">登录后即可使用所有功能</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl space-y-5">
          {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-100">{error}</div>}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">邮箱</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">密码</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少6位"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full rounded-xl py-3 text-sm font-semibold shadow-lg shadow-brand-500/25 disabled:opacity-50">
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          还没有账号？<Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">立即注册</Link>
        </p>
      </div>
    </div>
  );
}
