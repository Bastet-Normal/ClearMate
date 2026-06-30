"use client";

import { useState, useEffect } from "react";
import { Volume2, VolumeX, ChevronLeft, Search, Copy, AlertTriangle, Drama, Camera, MessageSquare, Phone } from "lucide-react";
import Link from "next/link";
import { searchCategoryRisks, type CategoryRisk } from "@/lib/category-risks";
import { safeGetItem } from "@/lib/client-storage";
import { useToast } from "@/components/ui/toast";
import { SectionCard } from "@/components/ui/section-card";
import { cn } from "@/lib/utils";

const HOT_KEYWORDS = ["一口价黄金", "网购退款", "租房押金", "网贷解冻", "医美贷款", "投资理财", "外卖赔付", "跟团旅游", "网络培训"];

export default function AvoidPitPage() {
  const [query, setQuery]               = useState("");
  const [results, setResults]           = useState<CategoryRisk[]>([]);
  const [searched, setSearched]         = useState(false);
  const [playingTitle, setPlayingTitle] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "消费避坑指南 - ClearMate";
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  useEffect(() => {
    window.speechSynthesis?.cancel(); setPlayingTitle(null);
  }, [query]);

  function speak(cat: CategoryRisk) {
    if (!window.speechSynthesis) return;
    if (playingTitle === cat.title) { window.speechSynthesis.cancel(); setPlayingTitle(null); return; }
    window.speechSynthesis.cancel();

    const isElder = safeGetItem("cm_elder_mode") === "elder";
    const text = `${cat.title}避坑指南。高频风险点：${cat.riskPoints.join("，")}。常见套路：${cat.commonTricks.join("，")}。建议应对：${cat.counterScripts.join("，")}`;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "zh-CN"; utt.rate = isElder ? 0.85 : 1.0;
    utt.onend = utt.onerror = () => setPlayingTitle(null);
    window.speechSynthesis.speak(utt); setPlayingTitle(cat.title);
  }

  function handleSearch() {
    if (!query.trim()) return;
    setResults(searchCategoryRisks(query));
    setSearched(true);
  }

  function copy(scripts: string[]) {
    navigator.clipboard.writeText(scripts.map((s, i) => `${i + 1}. ${s}`).join("\n"));
    toast.success("已复制全部反套路话术");
  }

  const dotList = (items: string[], dotClass: string) => (
    <ul className="space-y-2">
      {items.map((p, i) => (
        <li key={i} className="text-sm text-fg-secondary flex items-start gap-2">
          <span className={cn("font-bold shrink-0 mt-0.5", dotClass)}>•</span>
          <span className="leading-relaxed">{p}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-screen page-bg">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 space-y-6">

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-brand-600 dark:hover:text-brand-400 transition-colors animate-fade-in">
          <ChevronLeft className="h-4 w-4" /> 返回首页
        </Link>

        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-black text-fg-primary">🛡️ 避坑检索</h1>
          <p className="mt-1 text-sm text-fg-muted">买前搜一搜，消费不踩坑。输入商品、场景或陷阱词，快速获取避坑秘籍</p>
        </div>

        {/* Search */}
        <div className="space-y-3.5 animate-fade-in">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-faint pointer-events-none" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="搜索黄金、租房、网贷、虚假续费..."
                className="input-field pl-10 py-3 text-base"
              />
            </div>
            <button onClick={handleSearch} disabled={!query.trim()} className="btn btn-lg btn-primary px-8 shrink-0">
              查一查
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-fg-faint uppercase tracking-wider shrink-0">热门搜索:</span>
            {HOT_KEYWORDS.map(kw => (
              <button
                key={kw}
                onClick={() => { setQuery(kw); setResults(searchCategoryRisks(kw)); setSearched(true); }}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all border",
                  "bg-surface-0 text-fg-muted border-border",
                  "hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50/30"
                )}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>

        {/* No results */}
        {searched && results.length === 0 && (
          <div className="card rounded-2xl p-10 text-center space-y-4 animate-scale-in">
            <span className="text-5xl inline-block">🤔</span>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-fg-primary">未找到完全吻合的预置条款</h3>
              <p className="text-sm text-fg-muted">您可以尝试精简关键词，或直接提交给 AI 进行实时评估。</p>
            </div>
            <Link href="/tasks/new?type=scam_check" className="btn btn-md btn-primary inline-flex">
              由 AI 详细分析此遭遇
            </Link>
          </div>
        )}

        {/* Results */}
        {results.map((cat, idx) => (
          <div key={cat.title} className="space-y-4 animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
            {/* Title / TTS */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl shrink-0">{cat.icon}</span>
                <h2 className="text-xl sm:text-2xl font-black text-fg-primary">{cat.title}避坑指南</h2>
              </div>
              <button onClick={() => speak(cat)} className={cn("btn btn-sm", playingTitle === cat.title ? "btn-danger animate-pulse" : "btn-secondary")}>
                {playingTitle === cat.title ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                {playingTitle === cat.title ? "停止播放" : "读给我听"}
              </button>
            </div>

            <SectionCard title="高频风险点" icon={AlertTriangle} color="red">
              {dotList(cat.riskPoints, "text-red-500")}
            </SectionCard>

            <SectionCard title="常见套路" icon={Drama} color="amber">
              {dotList(cat.commonTricks, "text-amber-500")}
            </SectionCard>

            <SectionCard title="取证要点" icon={Camera} color="sky">
              {dotList(cat.evidenceTips, "text-sky-500")}
            </SectionCard>

            <SectionCard title="反制/应对话术" icon={MessageSquare} color="emerald"
              headerExtra={
                <button onClick={() => copy(cat.counterScripts)} className="btn btn-sm btn-secondary hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40">
                  <Copy className="h-3 w-3" /> 复制全部话术
                </button>
              }
            >
              <ul className="space-y-2.5">
                {cat.counterScripts.map((s, i) => (
                  <li key={i} className="text-sm text-fg-secondary font-medium pl-3.5 border-l-2 border-emerald-300 dark:border-emerald-700 leading-relaxed">
                    {s}
                  </li>
                ))}
              </ul>
            </SectionCard>

            {/* Channels */}
            {cat.relatedHelp.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-fg-faint flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> 推荐维权求助渠道
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cat.relatedHelp.map(h => (
                    <div key={h.name} className="flex items-center gap-1.5 rounded-xl bg-surface-0 px-3 py-2 text-xs border border-border shadow-sm">
                      <span className="font-bold text-brand-600 dark:text-brand-400 shrink-0">{h.name}:</span>
                      {/^\d+$/.test(h.contact) ? (
                        <a href={`tel:${h.contact}`} className="font-mono font-bold text-fg-primary underline hover:text-brand-500">
                          {h.contact}
                        </a>
                      ) : (
                        <span className="font-mono font-bold text-fg-primary">{h.contact}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-center">
              <Link href={`/tasks/new?type=scam_check`} className="btn btn-md btn-primary">
                提交到 AI 进行深度风险核查 <ChevronLeft className="h-4 w-4 rotate-180" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
