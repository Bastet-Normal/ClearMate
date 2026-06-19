"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getLLMMode, setLLMMode, getApiUrl, setApiUrl, type LLMMMode } from "@/lib/llm-mode";
import { checkApiAvailable } from "@/lib/unified-analyze";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const [mode, setMode] = useState<LLMMMode>("local");
  const [apiUrl, setApiUrlState] = useState("");
  const [checking, setChecking] = useState(false);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setMode(getLLMMode());
    setApiUrlState(getApiUrl());
  }, []);

  async function handleModeChange(newMode: LLMMMode) {
    setMode(newMode);
    setLLMMode(newMode);
    if (newMode === "api") {
      setChecking(true);
      const ok = await checkApiAvailable();
      setApiOk(ok);
      setChecking(false);
      if (!ok) {
        showToast("后端不可用，请确认 API 地址和后端服务", "error");
      } else {
        showToast("后端连接成功，已切换到真实 AI 模式");
      }
    } else {
      showToast("已切换到本地分析模式");
    }
  }

  async function handleCheckApi() {
    setChecking(true);
    setApiOk(null);
    const ok = await checkApiAvailable();
    setApiOk(ok);
    setChecking(false);
    if (ok) showToast("后端连接成功 ✅");
    else showToast("后端不可用 ❌", "error");
  }

  function handleSaveApiUrl() {
    setApiUrl(apiUrl);
    showToast("API 地址已保存");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">← 返回首页</Link>
      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold text-slate-900">⚙️ 设置</h1>
        <p className="mt-2 text-sm text-slate-500">配置 AI 分析模式和后端连接</p>
      </div>

      {/* LLM Mode */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm mb-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">AI 分析模式</h2>
        
        <div className="space-y-3">
          <label className={`flex items-start gap-3 cursor-pointer rounded-xl p-4 transition-all ${mode === "local" ? "bg-brand-50 border-2 border-brand-300" : "hover:bg-slate-50 border-2 border-transparent"}`}>
            <input type="radio" name="llm-mode" checked={mode === "local"} onChange={() => handleModeChange("local")} className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500" />
            <div>
              <p className="text-sm font-semibold text-slate-800">本地分析（默认）</p>
              <p className="mt-1 text-xs text-slate-500">浏览器内规则引擎，无需后端，无需 API Key。分析结果基于关键词匹配和预设规则。</p>
            </div>
          </label>

          <label className={`flex items-start gap-3 cursor-pointer rounded-xl p-4 transition-all ${mode === "api" ? "bg-brand-50 border-2 border-brand-300" : "hover:bg-slate-50 border-2 border-transparent"}`}>
            <input type="radio" name="llm-mode" checked={mode === "api"} onChange={() => handleModeChange("api")} className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500" />
            <div>
              <p className="text-sm font-semibold text-slate-800">真实 AI（后端代理）</p>
              <p className="mt-1 text-xs text-slate-500">通过后端 FastAPI 调用真实 LLM（OpenAI/DeepSeek/智谱等）。需要后端服务运行和 API Key 配置。</p>
              {mode === "api" && apiOk === false && (
                <p className="mt-2 text-xs text-red-600 font-medium">⚠️ 后端不可用，当前会回退到本地分析</p>
              )}
              {mode === "api" && apiOk === true && (
                <p className="mt-2 text-xs text-green-600 font-medium">✅ 后端连接正常</p>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* API URL */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm mb-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">后端地址</h2>
        <div className="flex gap-3">
          <input type="text" value={apiUrl} onChange={(e) => setApiUrlState(e.target.value)}
            placeholder="http://localhost:8000"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all" />
          <button onClick={handleSaveApiUrl} className="btn-primary shrink-0 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg shadow-brand-500/25">
            保存
          </button>
        </div>
        <div className="mt-4">
          <button onClick={handleCheckApi} disabled={checking}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50">
            {checking ? "检测中..." : "🔍 检测连接"}
          </button>
          {apiOk === true && <span className="ml-3 text-sm text-green-600 font-medium">连接成功 ✅</span>}
          {apiOk === false && <span className="ml-3 text-sm text-red-600 font-medium">连接失败 ❌</span>}
        </div>
      </div>

      {/* How to setup backend */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">如何启用真实 AI？</h2>
        <ol className="space-y-3 text-sm text-slate-600">
          <li className="flex gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">1</span>
            <span>启动后端：<code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono">cd apps/api && uvicorn app.main:app --reload</code></span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">2</span>
            <span>配置 API Key：在 <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono">apps/api/.env</code> 中设置</span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">3</span>
            <div>
              <p>必须设置：</p>
              <pre className="mt-2 rounded-xl bg-slate-900 p-4 text-xs font-mono text-green-400 overflow-x-auto">{`LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini  # 或 deepseek-chat 等`}</pre>
              <p className="mt-2">可选（兼容其他 OpenAI 协议厂商）：</p>
              <pre className="mt-2 rounded-xl bg-slate-900 p-4 text-xs font-mono text-green-400 overflow-x-auto">{`OPENAI_API_BASE=https://open.bigmodel.cn/api/paas/v4  # 智谱
# OPENAI_API_BASE=https://api.deepseek.com  # DeepSeek`}</pre>
            </div>
          </li>
          <li className="flex gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">4</span>
            <span>切换上方模式为"真实 AI"，检测连接成功即可</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
