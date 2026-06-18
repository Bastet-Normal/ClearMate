export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold text-xs">
              C
            </div>
            <span className="text-sm font-semibold text-slate-700">ClearMate</span>
          </div>
          <p className="text-xs text-slate-400">
            AI 分析仅供参考，不构成法律、金融或医疗建议 · 数据存储在本地浏览器
          </p>
        </div>
      </div>
    </footer>
  );
}
