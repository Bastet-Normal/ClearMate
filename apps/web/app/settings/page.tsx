"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getLLMMode, setLLMMode, getApiUrl, setApiUrl, type LLMMode } from "@/lib/llm-mode";
import { checkApiAvailable } from "@/lib/unified-analyze";
import { useToast } from "@/components/ui/toast";
import { getStoredProfile, setStoredProfile } from "@/lib/local-store";

export default function SettingsPage() {
  const [mode, setMode] = useState<LLMMode>("local");
  const [apiUrl, setApiUrlState] = useState("");
  const [checking, setChecking] = useState(false);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [realName, setRealName] = useState("");
  const [phone, setPhone] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    document.title = "系统设置 - ClearMate";
    setMode(getLLMMode());
    setApiUrlState(getApiUrl());
    const profile = getStoredProfile();
    setRealName(profile.real_name);
    setPhone(profile.phone);
  }, []);

  async function handleModeChange(newMode: LLMMode) {
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

  function handleSaveProfile() {
    setStoredProfile({ real_name: realName, phone });
    showToast("预填资料已成功保存！");
  }

  function handleExportData() {
    try {
      const data: Record<string, string | null> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("cm_")) {
          data[key] = localStorage.getItem(key);
        }
      }
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
      link.href = url;
      link.download = `clearmate_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("备份文件已成功导出！");
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (err: any) {
      showToast("导出备份失败: " + err.message, "error");
    }
  }

  function handleImportData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const resultText = event.target?.result as string;
        const parsed = JSON.parse(resultText);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("格式无效，备份文件必须是 JSON 对象");
        }
        const keys = Object.keys(parsed);
        const cmKeys = keys.filter(k => k.startsWith("cm_"));
        if (cmKeys.length === 0) {
          throw new Error("文件中未包含 ClearMate 的有效数据");
        }
        cmKeys.forEach(key => {
          const val = parsed[key];
          if (val !== null && val !== undefined) {
            localStorage.setItem(key, val);
          }
        });
        showToast("备份已成功导入，正在重新加载页面...");
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(50);
        }
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        showToast("导入失败: " + err.message, "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">← 返回首页</Link>
      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold text-slate-900">⚙️ 设置</h1>
        <p className="mt-2 text-sm text-slate-500">配置 AI 分析模式和您的申诉人档案信息</p>
      </div>

      {/* User Profile Info Card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm mb-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">✍️ 申诉预填资料</h2>
        <p className="text-xs text-slate-500 mb-4">在此设置您的基本资料，智能诊断后生成的维权申诉信模板将自动填入这些信息，省去手动填写的麻烦。</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">您的姓名 / 称呼</label>
            <input 
              type="text" 
              value={realName} 
              onChange={(e) => setRealName(e.target.value)} 
              placeholder="例如：张三（可选，用于申诉人署名）"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">手机号码</label>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="例如：13800000000（可选，用于联系方式）"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button 
              onClick={handleSaveProfile} 
              className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-5 py-2.5 text-xs font-bold shadow-md shadow-brand-500/20"
            >
              保存预填资料
            </button>
          </div>
        </div>
      </div>

      {/* Data Backup and Restore */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm mb-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">💾 数据备份与恢复</h2>
        <p className="text-xs text-slate-500 mb-4">备份您的所有任务、诊断书、以及预填资料到本地文件，或从备份文件中恢复，防止浏览器缓存清理导致数据丢失。</p>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleExportData} 
            className="rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-all shadow-sm"
          >
            📤 导出备份文件
          </button>
          <label className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all shadow-sm cursor-pointer">
            📥 导入备份文件
            <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
          </label>
        </div>
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
