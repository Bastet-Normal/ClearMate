"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft, User, Phone, Shield, Cpu, Database,
  Upload, Download, CheckCircle2, AlertCircle, Save, Loader2,
  LogIn, LogOut, KeyRound, Sparkles
} from "lucide-react";
import {
  getLLMMode, setLLMMode, getApiUrl, setApiUrl,
  getGeminiApiKey, setGeminiApiKey, type LLMMode,
} from "@/lib/llm-mode";
import { checkApiAvailable } from "@/lib/unified-analyze";
import {
  GOOGLE_CLOUD_PROJECT_ID, isOAuthConfigured, getOAuthStatus, loginWithGoogle, logoutGoogle, type OAuthStatus,
} from "@/lib/gemini-oauth";
import { useToast } from "@/components/ui/toast";
import { getStoredProfile, isApiAuthenticated, setStoredProfile } from "@/lib/local-store";
import { exportClearMateData, importClearMateData } from "@/lib/client-storage";
import { FormField, Input } from "@/components/ui/form";
import { cn } from "@/lib/utils";

const SECTION_ICONS = {
  profile: "bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300",
  data:    "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300",
  ai:      "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300",
  api:     "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300",
};

function SectionHeader({ icon: Icon, tone, title, desc }: {
  icon: React.ComponentType<{ className?: string }>;
  tone: string; title: string; desc: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h2 className="text-base font-bold text-fg-primary">{title}</h2>
        <p className="text-xs text-fg-faint">{desc}</p>
      </div>
    </div>
  );
}

const oauthReady = isOAuthConfigured();
export default function SettingsPage() {
  const [mode, setMode] = useState<LLMMode>("local");
  const [apiUrl, setApiUrlState] = useState("");
  const [checking, setChecking] = useState(false);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [realName, setRealName] = useState("");
  const [phone, setPhone] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [oauth, setOauth] = useState<OAuthStatus>({ active: false });
  const [oauthLoading, setOauthLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "系统设置 - ClearMate";
    setMode(getLLMMode());
    setApiUrlState(getApiUrl());
    setGeminiKey(getGeminiApiKey());
    setOauth(getOAuthStatus());
    const profile = getStoredProfile();
    setRealName(profile.real_name);
    setPhone(profile.phone);
  }, []);

  async function handleModeChange(newMode: LLMMode) {
    if (newMode === "gemini-oauth" && !oauthReady) {
      toast.error("暂不可用", "尚未配置 Google OAuth，请改用 API Key 或本地引擎");
      return;
    }
    setMode(newMode);
    setLLMMode(newMode);

    if (newMode === "api") {
      setChecking(true);
      const ok = await checkApiAvailable();
      setApiOk(ok);
      setChecking(false);
      if (!ok) {
        setMode("local");
        setLLMMode("local");
        toast.error("切换失败", "后端服务不可用，已自动回退本地引擎");
      } else if (isApiAuthenticated()) {
        toast.success("已连接", "后端服务与账号认证均可用");
      } else {
        toast.info("后端已连接", "请退出当前账号，并在 API 模式下重新登录或注册后端账号");
      }
    } else if (newMode === "gemini-oauth") {
      if (!oauth.active) toast.info("请完成授权", "点击下方「连接 Google」后再分析；token 过期后需重新连接");
      else toast.success("已切换", "使用 Google OAuth 直连 Gemini（实验）");
    } else if (newMode === "gemini-key") {
      if (!geminiKey.trim()) toast.info("请填写 Key", "在下方填入 Gemini API Key 后保存");
      else toast.success("已切换", "使用 API Key 直连 Gemini");
    } else {
      toast.success("已切换到本地离线引擎");
    }
  }

  async function handleGoogleLogin() {
    setOauthLoading(true);
    try {
      await loginWithGoogle();
      const st = getOAuthStatus();
      setOauth(st);
      toast.success("授权成功", st.email ? `已连接：${st.email}` : "已连接 Google 账号");
    } catch (err: any) {
      toast.error("授权失败", err.message || "Google 授权未完成");
    } finally {
      setOauthLoading(false);
    }
  }

  function handleGoogleLogout() {
    logoutGoogle();
    setOauth(getOAuthStatus());
    if (mode === "gemini-oauth") { setMode("local"); setLLMMode("local"); }
    toast.success("已断开 Google 授权");
  }

  function handleSaveApiKey() {
    setGeminiApiKey(geminiKey.trim());
    toast.success("API Key 已保存", geminiKey.trim() ? "下次分析将直连 Gemini" : "已清除 Key");
  }

  async function handleCheckApi() {
    setChecking(true);
    setApiOk(null);
    const ok = await checkApiAvailable();
    setApiOk(ok);
    setChecking(false);
    if (ok) toast.success("连接成功", "后端接口响应正常 ✅");
    else toast.error("连接失败", "无法访问后端接口 ❌");
  }

  function handleSaveApiUrl() {
    try {
      setApiUrl(apiUrl);
      setApiUrlState(getApiUrl());
      toast.success("后端地址已保存");
    } catch (err: any) {
      toast.error("地址无效", err.message || "请检查后端地址");
    }
  }

  function handleSaveProfile() {
    setStoredProfile({ real_name: realName, phone });
    toast.success("预填资料已保存");
  }

  function handleExportData() {
    try {
      const data = exportClearMateData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
      link.href = url;
      link.download = `clearmate_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("导出成功", "备份数据已保存至本地文件");
    } catch (err: any) {
      toast.error("导出失败", err.message);
    }
  }

  function handleImportData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const count = importClearMateData(parsed);
        toast.success("导入成功", `已恢复 ${count} 项数据，正在重新加载...`);
        setTimeout(() => window.location.reload(), 1200);
      } catch (err: any) {
        toast.error("导入失败", err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  /* 引擎选项卡片 */
  const ENGINE_OPTIONS: {
    value: LLMMode; title: string; desc: string; badge?: string;
  }[] = [
    { value: "local",       title: "本地离线引擎", desc: "无需 Key 与后端，分析内容不离开当前浏览器", badge: "默认" },
    { value: "gemini-oauth",title: "Gemini · Google OAuth", desc: "实验通道：用短期 Google 授权令牌直连，失败会回退本地引擎", badge: "实验" },
    { value: "gemini-key",  title: "Gemini · API Key", desc: "自填 Gemini API Key，浏览器直连，Key 仅存本地", badge: "" },
    { value: "api",         title: "后端 FastAPI", desc: "连接自建后端，由后端代理真实大模型", badge: "" },
  ];

  return (
    <div className="min-h-screen page-bg">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 space-y-6">

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-brand-600 dark:hover:text-brand-400 transition-colors animate-fade-in">
          <ChevronLeft className="h-4 w-4" /> 返回首页
        </Link>

        <div className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-black text-fg-primary">⚙️ 设置</h1>
          <p className="mt-1 text-sm text-fg-muted">配置 AI 分析引擎和个人档案</p>
        </div>

        <div className="grid gap-6 stagger-children">

          {/* 1. AI Engine */}
          <div className="card rounded-2xl p-5 sm:p-6 space-y-4 animate-stagger-in">
            <SectionHeader icon={Cpu} tone={SECTION_ICONS.ai} title="AI 分析引擎" desc="选择由谁来分析您的遭遇" />

            <div className="grid gap-3">
              {ENGINE_OPTIONS.map((opt) => {
                const active = mode === opt.value;
                return (
                  <label key={opt.value} className={cn(
                    "flex items-start gap-3 cursor-pointer rounded-xl p-4 transition-all border-2",
                    active
                      ? "bg-brand-50/50 dark:bg-brand-950/20 border-brand-300 dark:border-brand-800"
                      : "bg-surface-0 border-border hover:border-border-strong"
                  )}>
                    <input
                      type="radio"
                      name="llm-mode"
                      checked={active}
                      onChange={() => handleModeChange(opt.value)}
                      className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-fg-primary">{opt.title}</p>
                        {opt.badge && (
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                            opt.badge === "实验"
                              ? "bg-violet-500 text-white"
                              : "bg-surface-2 text-fg-muted"
                          )}>{opt.badge}</span>
                        )}
                      </div>
                      <p className="text-xs text-fg-muted leading-relaxed">{opt.desc}</p>

                      {/* Gemini OAuth 内联 */}
                      {opt.value === "gemini-oauth" && (
                        <div className="mt-3 rounded-lg bg-surface-1 border border-border p-3 space-y-2">
                          {!oauthReady ? (
                            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5" />
                              尚未配置 Google OAuth（缺少 NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID）
                            </p>
                          ) : oauth.active ? (
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                已连接{oauth.email ? `：${oauth.email}` : ""}
                              </span>
                              <button type="button" onClick={handleGoogleLogout} className="btn btn-sm btn-ghost text-fg-muted">
                                <LogOut className="h-3.5 w-3.5" /> 断开
                              </button>
                            </div>
                          ) : (
                            <button type="button" onClick={handleGoogleLogin} disabled={oauthLoading} className="btn btn-sm btn-primary">
                              {oauthLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
                              连接 Google
                            </button>
                          )}
                        </div>
                      )}

                      {/* Gemini Key 内联 */}
                      {opt.value === "gemini-key" && (
                        <div className="mt-3 flex gap-2">
                          <Input
                            type="password"
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            placeholder="粘贴 Gemini API Key"
                            leftIcon={<KeyRound className="h-4 w-4" />}
                            className="font-mono"
                          />
                          <button type="button" onClick={handleSaveApiKey} className="btn btn-md btn-primary px-5 shrink-0">
                            <Save className="h-3.5 w-3.5" /> 保存
                          </button>
                        </div>
                      )}

                      {/* 后端状态 */}
                      {opt.value === "api" && active && apiOk === false && (
                        <div className="flex items-center gap-1 text-[11px] text-red-500 font-semibold mt-1">
                          <AlertCircle className="h-3 w-3" /> 后端不可用，已自动回退本地引擎
                        </div>
                      )}
                      {opt.value === "api" && active && apiOk === true && (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                          <CheckCircle2 className="h-3 w-3" /> 连接正常
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-surface-1 border border-border p-3 text-xs text-fg-muted leading-relaxed">
              <Sparkles className="h-3.5 w-3.5 text-brand-500 shrink-0 mt-0.5" />
              <p>
                <span className="font-semibold text-fg-secondary">普通用户优先使用「本地离线」或「API Key」。</span>
                Google OAuth 是实验通道，可能受 Google Cloud 项目、敏感 scope 审核、quota project 与 IAM 配置影响；
                {GOOGLE_CLOUD_PROJECT_ID ? " 当前已配置 quota project。" : " 当前未配置 NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID。"}
                任何引擎失败都会自动回退本地引擎，不影响使用。
              </p>
            </div>
          </div>

          {/* 2. Profile prefill */}
          <div className="card rounded-2xl p-5 sm:p-6 space-y-4 animate-stagger-in">
            <SectionHeader icon={User} tone={SECTION_ICONS.profile} title="申诉人预填资料" desc="自动填入申诉书模板，省去每次手动输入" />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="您的姓名 / 称呼">
                <Input type="text" value={realName} onChange={(e) => setRealName(e.target.value)} placeholder="例如：张先生（可选）" />
              </FormField>
              <FormField label="手机号码">
                <Input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="例如：13800000000（可选）" leftIcon={<Phone className="h-4 w-4" />} />
              </FormField>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={handleSaveProfile} className="btn btn-sm btn-primary">
                <Save className="h-3.5 w-3.5" /> 保存预填资料
              </button>
            </div>
          </div>

          {/* 3. Backend endpoint */}
          <div className="card rounded-2xl p-5 sm:p-6 space-y-4 animate-stagger-in">
            <SectionHeader icon={Shield} tone={SECTION_ICONS.api} title="后端 API 接口配置" desc="仅「后端 FastAPI」模式需要" />
            <div className="flex gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrlState(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 input-field font-mono"
              />
              <button onClick={handleSaveApiUrl} className="btn btn-md btn-primary px-5 shrink-0">保存</button>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button onClick={handleCheckApi} disabled={checking} className="btn btn-sm btn-secondary gap-1.5">
                {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                检测连接状态
              </button>
              {apiOk === true && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">连接成功 ✅</span>}
              {apiOk === false && <span className="text-xs font-semibold text-red-500">连接失败 ❌</span>}
            </div>
          </div>

          {/* 4. Backup & restore */}
          <div className="card rounded-2xl p-5 sm:p-6 space-y-4 animate-stagger-in">
            <SectionHeader icon={Database} tone={SECTION_ICONS.data} title="本地数据管理" desc="备份您的所有任务、诊断书及个人资料" />
            <p className="text-xs text-fg-muted leading-relaxed">
              数据仅存储在当前浏览器本地。建议定期导出备份文件，以防清理缓存导致记录丢失。备份不包含账号、登录 token、后端地址、Gemini API Key 或 Google OAuth token；导入前请先登录对应账号。
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={handleExportData} className="btn btn-sm btn-secondary gap-1.5">
                <Download className="h-3.5 w-3.5" /> 导出备份 (.json)
              </button>
              <label className="btn btn-sm btn-secondary cursor-pointer gap-1.5">
                <Upload className="h-3.5 w-3.5" /> 导入备份
                <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
              </label>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
