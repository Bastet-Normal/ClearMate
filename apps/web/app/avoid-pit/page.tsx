"use client";

import { useState } from "react";
import Link from "next/link";
import { searchCategoryRisks, type CategoryRisk } from "@/lib/category-risks";
import { useToast } from "@/components/ui/toast";

const HOT_KEYWORDS = ["黄金", "网购", "租房", "贷款", "医美", "投资理财", "外卖", "旅游", "培训"];

export default function AvoidPitPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CategoryRisk[]>([]);
  const [searched, setSearched] = useState(false);
  const { showToast } = useToast();

  function handleSearch() {
    if (!query.trim()) return;
    setResults(searchCategoryRisks(query));
    setSearched(true);
  }

  function copyScripts(scripts: string[]) {
    navigator.clipboard.writeText(scripts.map((s, i) => `${i + 1}. ${s}`).join("\n"));
    showToast("话术已复制到剪贴板");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">← 返回首页</Link>
      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold text-slate-900">🛡️ 消费避坑</h1>
        <p className="mt-2 text-sm text-slate-500">买前查一查，消费不踩坑。输入商品、商家或场景，AI 帮你识别风险</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="flex gap-3">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            placeholder="例如：一口价黄金、拼多多、租房押金、网贷解冻费..."
            className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 shadow-sm"
          />
          <button onClick={handleSearch} disabled={!query.trim()}
            className="btn-primary shrink-0 rounded-xl px-8 py-3.5 text-sm font-semibold shadow-lg shadow-brand-500/25 disabled:opacity-50">
            查一查
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {HOT_KEYWORDS.map((kw) => (
            <button key={kw} onClick={() => { setQuery(kw); setResults(searchCategoryRisks(kw)); setSearched(true); }}
              className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition-all border border-slate-100 hover:border-brand-200">
              {kw}
            </button>
          ))}
        </div>
      </div>

      {/* No results */}
      {searched && results.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="mb-3 text-4xl">🤔</div>
          <p className="text-sm text-slate-500">暂未找到匹配的品类风险，试试其他关键词？</p>
          <p className="mt-2 text-xs text-slate-400">你也可以直接<Link href="/tasks/new?scam_check" className="text-brand-600 hover:underline">创建任务</Link>让 AI 分析</p>
        </div>
      )}

      {/* Results */}
      {results.map((cat) => (
        <div key={cat.title} className="mb-8 space-y-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{cat.icon}</span>
            <h2 className="text-2xl font-bold text-slate-900">{cat.title}避坑指南</h2>
          </div>

          {/* Risk Points */}
          <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-rose-50 p-6">
            <h3 className="mb-3 text-sm font-bold text-red-700">⚠️ 高频风险点</h3>
            <ul className="space-y-2">
              {cat.riskPoints.map((p, i) => (
                <li key={i} className="text-sm text-red-600 pl-4 border-l-2 border-red-200 leading-relaxed">{p}</li>
              ))}
            </ul>
          </div>

          {/* Common Tricks */}
          <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 p-6">
            <h3 className="mb-3 text-sm font-bold text-amber-700">🎭 常见套路</h3>
            <ul className="space-y-2">
              {cat.commonTricks.map((t, i) => (
                <li key={i} className="text-sm text-amber-700 pl-4 border-l-2 border-amber-200 leading-relaxed">{t}</li>
              ))}
            </ul>
          </div>

          {/* Evidence Tips */}
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
            <h3 className="mb-3 text-sm font-bold text-blue-700">📸 取证清单</h3>
            <ul className="space-y-2">
              {cat.evidenceTips.map((t, i) => (
                <li key={i} className="text-sm text-blue-700 pl-4 border-l-2 border-blue-200 leading-relaxed">{t}</li>
              ))}
            </ul>
          </div>

          {/* Counter Scripts */}
          <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-green-700">💬 反套路话术</h3>
              <button onClick={() => copyScripts(cat.counterScripts)}
                className="rounded-lg border border-green-200 bg-white px-3 py-1 text-xs font-medium text-green-600 hover:bg-green-50 transition-all shadow-sm">
                📋 复制全部话术
              </button>
            </div>
            <ul className="space-y-2">
              {cat.counterScripts.map((s, i) => (
                <li key={i} className="text-sm text-green-700 pl-4 border-l-2 border-green-200 leading-relaxed font-medium">{s}</li>
              ))}
            </ul>
          </div>

          {/* Help Channels */}
          {cat.relatedHelp.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {cat.relatedHelp.map((h) => (
                <span key={h.name} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-xs border border-brand-100">
                  <span className="font-semibold text-brand-700">{h.name}</span>
                  {/^\d+$/.test(h.contact) ? (
                    <a href={`tel:${h.contact}`} className="font-mono font-bold text-brand-600 hover:underline">{h.contact}</a>
                  ) : (
                    <span className="font-mono font-bold text-brand-600">{h.contact}</span>
                  )}
                </span>
              ))}
            </div>
          )}

          <div className="text-center">
            <Link href={`/tasks/new?scam_check`} className="btn-primary inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg shadow-brand-500/25">
              创建任务让 AI 深度分析 →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
