import Link from "next/link";
import { ShieldCheck, Github, ExternalLink, Heart } from "lucide-react";

const LINKS = {
  功能: [
    { label: "风险自检",   href: "/self-check" },
    { label: "避坑指南",   href: "/avoid-pit" },
    { label: "我的任务",   href: "/tasks" },
    { label: "维权看板",   href: "/dashboard" },
  ],
  帮助: [
    { label: "12315 投诉热线", href: "tel:12315",                     external: false },
    { label: "黑猫投诉平台",  href: "https://tousu.sina.com.cn",      external: true },
    { label: "消协官网",      href: "https://www.cca.org.cn",         external: true },
    { label: "全国法院查询",  href: "https://www.court.gov.cn",       external: true },
  ],
};

export function Footer() {
  return (
    <footer className="border-t" style={{ background: "rgb(var(--bg-1))", borderColor: "rgb(var(--border))" }}>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">

          {/* Brand column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-md shadow-brand-500/25">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-black text-gradient-brand">ClearMate</span>
            </div>
            <p className="text-sm text-fg-muted leading-relaxed max-w-xs">
              帮普通人看懂风险、处理麻烦、维护权益的 AI 生活事务代理平台。零后端依赖，数据保存本地，隐私优先。
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/wangjiehu/ClearMate"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-fg-faint hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                <Github className="h-4 w-4" />
                开源项目
              </a>
              <span className="text-fg-faint">·</span>
              <span className="text-xs text-fg-faint">MIT License</span>
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group} className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-fg-faint">
                {group}
              </h3>
              <ul className="space-y-2">
                {items.map(item => (
                  <li key={item.label}>
                    {"external" in item && item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-fg-muted hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                      >
                        {item.label}
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-sm text-fg-muted hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-6">
          <p className="text-xs text-fg-faint text-center sm:text-left">
            © 2026 ClearMate. AI 分析结果仅供参考，不构成法律建议。
          </p>
          <p className="flex items-center gap-1 text-xs text-fg-faint shrink-0">
            Made with <Heart className="h-3 w-3 text-red-400 fill-red-400" /> by wangjiehu
          </p>
        </div>
      </div>
    </footer>
  );
}
