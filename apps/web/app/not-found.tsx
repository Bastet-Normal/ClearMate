"use client";

import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 page-bg">
      <div className="text-center animate-fade-in-up">
        {/* Floating 404 */}
        <div className="relative mx-auto mb-8 w-fit">
          <span className="text-[8rem] sm:text-[10rem] font-black leading-none text-gradient-brand select-none">
            404
          </span>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-4 w-32 bg-brand-500/10 rounded-full blur-lg" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-fg-primary mb-2">
          页面走丢了
        </h1>
        <p className="text-sm text-fg-muted mb-8 max-w-sm mx-auto">
          您访问的页面可能已被移除、改名，或暂时不可用。
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="btn btn-lg btn-primary">
            <Home className="h-4 w-4" />
            回到首页
          </Link>
          <button
            onClick={() => typeof window !== "undefined" && window.history.back()}
            className="btn btn-lg btn-ghost text-fg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            返回上一页
          </button>
        </div>
      </div>
    </div>
  );
}
