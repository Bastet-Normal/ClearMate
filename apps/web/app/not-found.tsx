import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6">
      <div className="mb-6 text-8xl">😕</div>
      <h1 className="mb-3 text-3xl font-bold text-slate-900">页面不存在</h1>
      <p className="mb-8 text-sm text-slate-500">你访问的页面可能已被移除或地址有误</p>
      <Link href="/" className="btn-primary rounded-xl px-7 py-3 text-sm font-semibold shadow-lg shadow-brand-500/25">
        回到首页
      </Link>
    </div>
  );
}
