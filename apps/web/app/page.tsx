"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { isLoggedIn, getStoredUser, setStoredUser, getStoredProfile } from "@/lib/local-store";
import { unifiedAnalyze, checkApiAvailable } from "@/lib/unified-analyze";
import { analyzeWithProgress } from "@/lib/analyze-progress";
import type { MemberMode, AnalysisResult } from "@/types";
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  PhoneCall, 
  ExternalLink, 
  FileText, 
  ChevronRight, 
  Info,
  Sparkles,
  Zap,
  User,
  HeartHandshake,
  Compass,
  Scale,
  Camera,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  HelpCircle,
  Phone,
  FileCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

const RISK_CONFIG = {
  critical: {
    bg: "bg-rose-50 border-rose-200 text-rose-800",
    badge: "bg-rose-100 border border-rose-300 text-rose-700 font-bold",
    barColor: "bg-rose-600",
    barPct: 100,
    icon: ShieldAlert,
    label: "极高风险",
    advice: "该事件极可能是专门设计的骗局，建议您立即终止汇款/转账，妥善保留截图等证据，并直接报警或联系消协申诉！",
  },
  high: {
    bg: "bg-orange-50 border-orange-200 text-orange-800",
    badge: "bg-orange-100 border border-orange-300 text-orange-700 font-bold",
    barColor: "bg-orange-500",
    barPct: 75,
    icon: ShieldAlert,
    label: "高风险",
    advice: "检测出高危陷阱特征，可能侵犯您的消费者权益或面临欺诈损失。建议按指引收集证据并向投诉部门发起申诉。",
  },
  medium: {
    bg: "bg-amber-50 border-amber-300 text-amber-800",
    badge: "bg-amber-100 border border-amber-300 text-amber-700 font-bold",
    barColor: "bg-amber-500",
    barPct: 50,
    icon: AlertTriangle,
    label: "中等风险",
    advice: "协议条款或对方规则中包含模糊限制，有潜在扣费或霸王条款漏洞，请在进一步沟通中核实对方口头承诺。",
  },
  low: {
    bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
    badge: "bg-emerald-100 border border-emerald-300 text-emerald-700 font-bold",
    barColor: "bg-emerald-500",
    barPct: 25,
    icon: ShieldCheck,
    label: "低风险",
    advice: "未发现典型欺诈或违规风险。建议按标准维权途径或官方客服退改规则解决问题。",
  },
};

import { autoFillTemplate } from "@/lib/template-filler";

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [memberMode, setMemberMode] = useState<MemberMode>("normal");
  const [quickInput, setQuickInput] = useState("");
  const [quickType, setQuickType] = useState("scam_check");
  const [quickResult, setQuickResult] = useState<AnalysisResult | null>(null);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickProgress, setQuickProgress] = useState("");
  const [quickProgressPct, setQuickProgressPct] = useState(0);
  
  // UI States
  const [activeTab, setActiveTab] = useState<"action" | "script" | "cases">("action");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // Advanced Features States
  const [ocrLoading, setOcrLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [customKey, setCustomKey] = useState("");
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<"wechat" | "alipay" | "apple" | "android">("wechat");
  const [aiMode, setAiMode] = useState<"local" | "api" | "custom">("local");
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  function refreshAiMode() {
    if (typeof window === "undefined") return;
    const savedKey = localStorage.getItem("cm_custom_gemini_key") || "";
    const mode = localStorage.getItem("cm_llm_mode") || "local";
    if (savedKey.trim()) {
      setAiMode("custom");
    } else if (mode === "api") {
      setAiMode("api");
      checkApiAvailable().then(res => setApiConnected(res));
    } else {
      setAiMode("local");
    }
  }

  function renderStatusBadge(isElderLayout: boolean) {
    let text = "本地分析引擎已启用";
    let colorClass = "bg-slate-100 text-slate-600 border-slate-200";
    
    if (aiMode === "custom") {
      text = "自定义 Gemini AI 已启用";
      colorClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
    } else if (aiMode === "api") {
      if (apiConnected === true) {
        text = "智能 AI 后端已连接";
        colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
      } else if (apiConnected === false) {
        text = "AI 后端连接异常 (已回退本地分析)";
        colorClass = "bg-amber-50 text-amber-700 border-amber-200";
      } else {
        text = "正在检测 AI 后端连接...";
        colorClass = "bg-slate-50 text-slate-500 border-slate-100";
      }
    }

    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border shadow-sm select-none",
        isElderLayout ? "text-base py-1.5 px-3 border-2" : "text-[11px]",
        colorClass
      )}>
        <span className={cn(
          "h-1.5 w-1.5 rounded-full",
          aiMode === "local" ? "bg-slate-400" :
          aiMode === "custom" ? "bg-indigo-500" :
          apiConnected === true ? "bg-emerald-500" :
          apiConnected === false ? "bg-amber-500" : "bg-slate-300"
        )} />
        {text}
      </span>
    );
  }
  
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workbenchRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Initialize and synchronize memberMode (elder/normal) from localStorage and global events
  useEffect(() => {
    document.title = "ClearMate - AI 适老维权与消费守护平台";
    if (typeof window !== "undefined") {
      const elderPref = localStorage.getItem("cm_elder_mode");
      const user = getStoredUser();
      const activeMode = (elderPref === "elder" || user?.member_mode === "elder") ? "elder" : "normal";
      setMemberMode(activeMode);

      const handleModeChange = (e: Event) => {
        const customEvent = e as CustomEvent;
        setMemberMode(customEvent.detail?.isElder ? "elder" : "normal");
      };

      window.addEventListener("cm:elder-mode-change", handleModeChange);
      return () => {
        window.removeEventListener("cm:elder-mode-change", handleModeChange);
      };
    }
  }, []);

  // Speech Recognition (STT) initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = "zh-CN";
        
        rec.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          setQuickInput(prev => prev + (prev ? " " : "") + transcript);
        };
        
        rec.onend = () => {
          setIsListening(false);
        };
        
        rec.onerror = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = rec;
      }
      
      // Load saved Custom API Key
      const savedKey = localStorage.getItem("cm_custom_gemini_key") || "";
      setCustomKey(savedKey);
      refreshAiMode();
    }
  }, []);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // When result loads, smooth scroll to report
  useEffect(() => {
    if (quickResult && reportRef.current) {
      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [quickResult]);

  async function handleQuickAnalyze() {
    if (!quickInput.trim()) return;
    setQuickLoading(true);
    setQuickResult(null);
    setQuickProgress("");
    setQuickProgressPct(0);
    
    // Stop speaking if any voice is active
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
    }
    
    const result = await analyzeWithProgress(
      () => unifiedAnalyze(quickType, quickInput, ""),
      quickType,
      (step, pct) => { 
        const laymanSteps: Record<string, string> = {
          "提取核心要素": "正在认真阅读您提供的信息...",
          "比对欺诈规则库": "正在对比消费者保护法以及维权防坑数据库...",
          "生成行动指引": "正在规划最有效的解决行动指南...",
          "起草维权模板": "正在为您拟就正式的申诉公文模板...",
        };
        
        let warmStep = step;
        for (const [key, value] of Object.entries(laymanSteps)) {
          if (step.includes(key)) {
            warmStep = value;
            break;
          }
        }
        setQuickProgress(warmStep); 
        setQuickProgressPct(pct); 
      }
    );
    setQuickResult(result);
    setQuickLoading(false);
    if (result._error) {
      setToastMessage(result._error);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
  }

  // OCR Recognition handler
  async function handleOcrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setOcrLoading(true);
    setToastMessage("正在从图片中读取文字，请稍候...");
    setShowToast(true);
    
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("chi_sim"); // Simplified Chinese language pack
      const ret = await worker.recognize(file);
      await worker.terminate();
      
      const text = ret.data.text.trim();
      if (text) {
        setQuickInput(prev => prev + (prev ? "\n" : "") + text);
        setToastMessage("图片文字提取成功！");
      } else {
        setToastMessage("提取失败，图片中未识别到清晰文字。");
      }
    } catch (err: any) {
      console.error(err);
      setToastMessage("图片文字读取失败，建议直接打字输入。");
    } finally {
      setOcrLoading(false);
      setTimeout(() => setShowToast(false), 2000);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Voice output control (TTS)
  function speakReport(result: AnalysisResult) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("抱歉，您的浏览器不支持语音播放。");
      return;
    }
    
    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }
    
    // Warm text summary
    const textToSpeak = `诊断书分析结论为：${result.summary}。当前风险评估级别：${RISK_CONFIG[result.risk_level]?.label || "低风险"}。我们的具体防坑建议是：${RISK_CONFIG[result.risk_level]?.advice || ""}`;
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "zh-CN";
    utterance.rate = memberMode === "elder" ? 0.85 : 1.0; // Warm slower rate for elder audience
    
    utterance.onend = () => {
      setIsPlayingVoice(false);
    };
    utterance.onerror = () => {
      setIsPlayingVoice(false);
    };
    
    window.speechSynthesis.speak(utterance);
    setIsPlayingVoice(true);
  }

  // Helper to play short audio feedback tone
  function playAudioBeep(frequency: number, duration: number) {
    if (typeof window === "undefined") return;
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Beep failed", e);
    }
  }

  // STT recording switch
  function toggleListening() {
    if (!recognitionRef.current) {
      alert("抱歉，您的浏览器不支持语音输入，推荐在 Chrome 或华为浏览器下测试。");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      playAudioBeep(440, 0.12);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      playAudioBeep(660, 0.12);
    }
  }

  // Save Custom Key settings
  function saveCustomKey() {
    const trimmedKey = customKey.trim();
    if (trimmedKey) {
      if (!trimmedKey.startsWith("AIzaSy")) {
        setToastMessage("⚠️ 密钥格式似乎不正确，通常以 AIzaSy 开头，请检查后重新保存。");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }
      localStorage.setItem("cm_custom_gemini_key", trimmedKey);
      setToastMessage("Gemini API 密钥已保存，已启用本地直接分析模式！");
    } else {
      localStorage.removeItem("cm_custom_gemini_key");
      setToastMessage("自定义密钥已清除，已回退到默认诊断模式。");
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
    refreshAiMode();
    setShowKeyPanel(false);
  }

  function triggerCopy(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setToastMessage("复制成功！模板已复制到剪贴板。");
    setShowToast(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
    setTimeout(() => {
      setCopiedIndex(null);
      setShowToast(false);
    }, 2000);
  }

  function toggleElderMode() {
    const newMode: MemberMode = memberMode === "elder" ? "normal" : "elder";
    const nextIsElder = newMode === "elder";
    setMemberMode(newMode);
    localStorage.setItem("cm_elder_mode", newMode);
    const user = getStoredUser();
    if (user) setStoredUser({ ...user, member_mode: newMode });

    // Dispatch global event
    window.dispatchEvent(new CustomEvent("cm:elder-mode-change", { detail: { isElder: nextIsElder } }));
  }

  const isElder = memberMode === "elder";

  const placeholders: Record<string, string> = {
    scam_check: "例如：收到一条中奖短信，说中了个苹果手机，但是需要我先付100元的邮费或者解冻费，这靠谱吗？",
    refund_request: "例如：在网上买了一件衣服，商家过了十天都不发货，找他退款他还推脱，找各种借口拒绝退钱怎么办？",
    document_review: "例如：租房合同里写着『如果租客提前搬走，即使提前一个月通知，房东也有权不退还押金和未到期的租金』，这合法吗？",
    subscription_cancel: "例如：手机上不知道什么时候被自动扣了29元包月费，想去微信和支付宝取消，不知道怎么关掉？",
  };

  const types = [
    { value: "scam_check", label: "🔍 防坑防骗识别", desc: "辨别网络兼职、中奖短信、退款电话等骗局", color: "bg-blue-50/50 border-blue-100 hover:border-blue-300" },
    { value: "refund_request", label: "💰 退款与投诉", desc: "网购被骗、不发货、不退款等纠纷的话术及申诉", color: "bg-indigo-50/50 border-indigo-100 hover:border-indigo-300" },
    { value: "document_review", label: "📄 看懂霸王条款", desc: "帮您指出租房、借贷或消费合同里的霸王条款", color: "bg-purple-50/50 border-purple-100 hover:border-purple-300" },
    { value: "subscription_cancel", label: "🔓 自动续费取消", desc: "苹果、安卓及各类APP找不到自动续费的关闭入口", color: "bg-amber-50/50 border-amber-100 hover:border-amber-300" },
  ];

  // ================= 老人关怀模式视图 =================
  if (isElder) {
    return (
      <div className="min-h-screen bg-amber-50/20 text-slate-900 pb-20 font-sans elder-mode">
        {/* 老人版头部 */}
        <section className="bg-blue-700 text-white py-12 px-6 text-center border-b-8 border-blue-800">
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-wide leading-tight">
              👵 关怀守护版 — ClearMate 避坑助手
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-blue-100">
              帮您识别中奖诈骗短信，自动书写官方投诉信，守护您的血汗钱！
            </p>
          </div>
        </section>

        {/* 老人版功能标签 */}
        <section className="max-w-4xl mx-auto px-6 mt-10">
          <h2 className="text-2xl font-black text-slate-800 mb-4">第一步：点击选择您的麻烦</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {types.map((type) => {
              const isSelected = quickType === type.value;
              return (
                <button
                  key={type.value}
                  onClick={() => { setQuickType(type.value); setQuickResult(null); }}
                  className={cn(
                    "p-6 rounded-2xl border-4 text-left transition-all",
                    isSelected 
                      ? "border-blue-600 bg-blue-50 shadow-md" 
                      : "border-slate-300 bg-white hover:border-slate-400"
                  )}
                >
                  <p className="text-2xl font-black text-slate-800">{type.label}</p>
                  <p className="text-base text-slate-600 mt-2 font-semibold">{type.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* 老人版输入沙盒 */}
        <section className="max-w-4xl mx-auto px-6 mt-10">
          <div className="bg-white rounded-2xl border-4 border-slate-300 p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-800 mb-3">第二步：在这里说出或写下事情</h2>
            
            <div className="relative">
              <textarea
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder={placeholders[quickType]}
                rows={5}
                className="w-full rounded-xl border-4 border-slate-300 p-4 text-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 bg-slate-50 resize-none leading-relaxed"
              />
              
              {/* Voice and OCR button row for Elderly */}
              <div className="absolute right-4 bottom-4 flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white hover:bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 flex items-center gap-1.5 text-slate-700"
                  title="拍照上传"
                >
                  <Camera className="h-6 w-6 text-blue-600" />
                  <span className="text-base font-extrabold">拍照片读字</span>
                </button>
                <button
                  onClick={toggleListening}
                  className={cn(
                    "border-2 rounded-xl p-2.5 flex items-center gap-1.5 transition-all select-none",
                    isListening 
                      ? "bg-rose-100 border-rose-500 text-rose-700 animate-pulse" 
                      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                  )}
                  title="语音输入"
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-6 w-6 text-rose-600 animate-pulse" />
                      <div className="flex items-center gap-0.5 h-5 px-1 select-none">
                        <span className="w-0.5 h-3.5 bg-rose-500 rounded animate-wave-bar" style={{ animationDelay: '0.1s' }} />
                        <span className="w-0.5 h-3.5 bg-rose-500 rounded animate-wave-bar" style={{ animationDelay: '0.3s' }} />
                        <span className="w-0.5 h-3.5 bg-rose-500 rounded animate-wave-bar" style={{ animationDelay: '0.2s' }} />
                        <span className="w-0.5 h-3.5 bg-rose-500 rounded animate-wave-bar" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </>
                  ) : (
                    <Mic className="h-6 w-6 text-blue-600" />
                  )}
                  <span className="text-base font-extrabold">{isListening ? "正在听您说话..." : "按住说话"}</span>
                </button>
              </div>
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleOcrUpload} 
              className="hidden" 
            />

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-4">
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-slate-500">已输入 {quickInput.length} 个字</span>
                {renderStatusBadge(true)}
              </div>
              <button
                onClick={handleQuickAnalyze}
                disabled={quickLoading || !quickInput.trim()}
                className="bg-blue-600 text-white rounded-xl px-8 py-4 text-2xl font-black hover:bg-blue-700 disabled:opacity-40 shadow-lg disabled:pointer-events-none transition-all flex items-center gap-2"
              >
                {quickLoading ? (
                  <>
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-white border-t-transparent" />
                    <span>AI 正在帮您仔细分析，请等候...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-6 w-6 text-yellow-300" />
                    <span>开始智能诊断</span>
                  </>
                )}
              </button>
            </div>

            {quickLoading && (
              <div className="mt-6 border-4 border-blue-200 bg-blue-50/50 p-6 rounded-2xl space-y-4">
                <p className="text-xl font-extrabold text-blue-800 flex items-center gap-2">
                  <span>分析状态：{quickProgress}</span>
                </p>
                <div className="h-6 w-full rounded-full bg-slate-200 overflow-hidden border-2 border-slate-300">
                  <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${Math.round(quickProgressPct * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 老人版报告输出 */}
        {quickResult && (
          <section ref={reportRef} className="max-w-4xl mx-auto px-6 mt-10 scroll-mt-6">
            <div className="bg-white rounded-2xl border-8 border-blue-700 shadow-xl p-6 sm:p-8 space-y-8">
              
              {/* 警示条 */}
              <div className={cn(
                "border-4 p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4",
                quickResult.risk_level === "critical" || quickResult.risk_level === "high" ? "bg-red-50 border-red-500 text-red-800" : "bg-emerald-50 border-emerald-500 text-emerald-800"
              )}>
                <div className="flex items-start gap-4">
                  <ShieldAlert className="h-10 w-10 text-red-600 shrink-0 mt-1" />
                  <div>
                    <span className="bg-red-600 text-white px-3 py-1.5 text-lg font-black rounded-lg">
                      {RISK_CONFIG[quickResult.risk_level]?.label || "中低风险"}
                    </span>
                    <p className="text-2xl font-extrabold text-slate-800 mt-3">
                      诊断结果：{quickResult.summary}
                    </p>
                  </div>
                </div>
                
                {/* TTS Reader button for Elderly */}
                <button
                  onClick={() => speakReport(quickResult)}
                  className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-3 text-lg font-black flex items-center gap-2 shadow"
                >
                  {isPlayingVoice ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6 animate-bounce" />}
                  <span>{isPlayingVoice ? "停止播报" : "大声朗读诊断建议"}</span>
                </button>
              </div>

              {/* 提取到的证据与合同陷阱 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-100 border-4 border-slate-300 rounded-xl p-5">
                  <h3 className="text-2xl font-black text-slate-800 mb-3">📸 维权必须截图保留的凭证</h3>
                  <ul className="space-y-3">
                    {quickResult.evidence_checklist.map((ev, idx) => (
                      <li key={idx} className="text-lg text-slate-700 font-extrabold flex items-start gap-2">
                        <Check className="h-6 w-6 text-green-600 mt-1 shrink-0" />
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-100 border-4 border-slate-300 rounded-xl p-5">
                  <h3 className="text-2xl font-black text-slate-800 mb-3">⚠️ 条款里的猫腻与风险点</h3>
                  <ul className="space-y-3">
                    {quickResult.risk_points.map((pt, idx) => (
                      <li key={idx} className="text-lg text-slate-700 font-extrabold flex items-start gap-2">
                        <AlertTriangle className="h-6 w-6 text-red-600 mt-1 shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 谈判对线话术 */}
              {quickResult.counter_scripts.length > 0 && (
                <div className="border-4 border-slate-300 rounded-xl p-5 bg-yellow-50/20">
                  <h3 className="text-2xl font-black text-slate-800 mb-3">💬 对方如果推诿，直接念这几段话抗辩</h3>
                  <div className="space-y-4">
                    {quickResult.counter_scripts.map((sc, idx) => (
                      <div key={idx} className="p-4 bg-white border-2 border-slate-300 rounded-xl relative group">
                        <p className="text-xl font-black text-slate-800 pr-16 leading-relaxed">{sc}</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(sc);
                            setToastMessage("话术成功复制到剪贴板！");
                            setShowToast(true);
                            if (typeof navigator !== "undefined" && navigator.vibrate) {
                              navigator.vibrate(50);
                            }
                            setTimeout(() => setShowToast(false), 2000);
                          }}
                          className="absolute right-3 top-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 p-2.5 rounded-xl font-black text-base text-blue-700"
                        >
                          复制话术
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 生成的申诉材料 */}
              {quickResult.templates.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-slate-800">📝 自动生成的申诉信模板 (内容已帮您填入)</h3>
                  {quickResult.templates.map((tpl, idx) => (
                    <div key={idx} className="border-4 border-slate-300 rounded-xl overflow-hidden bg-slate-50">
                      <div className="bg-slate-200 px-4 py-3 flex justify-between items-center border-b-4 border-slate-300">
                        <span className="text-xl font-black text-slate-800">{tpl.title}</span>
                        <button
                          onClick={() => triggerCopy(autoFillTemplate(tpl.content, quickInput), idx)}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 text-lg font-extrabold"
                        >
                          {copiedIndex === idx ? "已成功复制信件" : "复制申诉信全文"}
                        </button>
                      </div>
                      <div className="p-4 bg-white">
                        {/* Letter paper for Elderly */}
                        <div className="letter-paper rounded-lg p-5 font-sans text-xl text-slate-700 font-bold border-2">
                          {autoFillTemplate(tpl.content, quickInput).split("\n").map((line, lIdx) => (
                            <p key={lIdx} className="min-h-[2.2rem]">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 求助渠道 */}
              {quickResult.help_channels.length > 0 && (
                <div className="border-4 border-red-200 bg-red-50/30 p-5 rounded-xl">
                  <h3 className="text-2xl font-black text-red-800 mb-3 flex items-center gap-1.5">
                    <Phone className="h-6 w-6" />
                    <span>你可以打这些官方电话申诉或报案</span>
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {quickResult.help_channels.map((ch, idx) => (
                      <div key={idx} className="bg-white border-2 border-red-300 p-4 rounded-xl flex items-center gap-4">
                        <div>
                          <p className="text-lg font-black text-slate-800">{ch.name}</p>
                          <p className="text-sm text-slate-500 font-bold">{ch.desc}</p>
                        </div>
                        {/^\d+$/.test(ch.contact) ? (
                          <a 
                            href={`tel:${ch.contact}`} 
                            className="bg-red-600 text-white font-extrabold px-5 py-3 rounded-xl text-lg hover:bg-red-700 shadow-md"
                          >
                            直接拨号 {ch.contact}
                          </a>
                        ) : (
                          <span className="bg-slate-100 text-slate-700 font-extrabold px-3 py-2 rounded-xl text-base">
                            {ch.contact}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-400 leading-relaxed italic mt-4">{quickResult.disclaimer}</p>
            </div>
          </section>
        )}

        {/* 老人模式底部切换 */}
        <div className="max-w-4xl mx-auto px-6 mt-12 text-center">
          <button
            onClick={toggleElderMode}
            className="bg-slate-900 text-white border-4 border-slate-700 px-8 py-3.5 rounded-2xl text-xl font-black hover:bg-slate-800"
          >
            🔤 切换回标准版视图
          </button>
        </div>

        {/* Toast */}
        {showToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl text-xl font-bold border-2 border-slate-700">
              {toastMessage}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= 标准温和浅色模式视图 =================
  return (
    <div className="min-h-screen light-workspace font-sans overflow-x-hidden pb-16 transition-colors duration-300">
      
      {/* Background Grid */}
      <div className="absolute top-0 left-0 w-full h-[650px] pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 grid-mesh opacity-70" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl pointer-events-none animate-pulse-subtle" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-100/40 blur-3xl pointer-events-none animate-float" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-12 pb-6 text-center animate-fade-in">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-semibold text-blue-700 mb-6 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>您的生活事务 AI 助手 • 守护您的钱包与权益</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
          生活遇纠纷？<br />
          <span className="text-blue-600 drop-shadow-sm font-black mt-2 inline-block">
            让 ClearMate AI 帮您出谋划策
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
          帮你看清合同陷阱、起草催款投诉信、教你怎么跟商家谈判。不用懂法律，输入大白话，AI 帮您一步步解决。
        </p>

        <div className="mt-6 flex flex-wrap justify-center items-center gap-3">
          {loggedIn && (
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:-translate-y-0.5">
              <Compass className="h-5 w-5" />
              <span>进入我的维权记录</span>
            </Link>
          )}
          
          <button
            onClick={() => setShowKeyPanel(!showKeyPanel)}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm"
          >
            <Settings className="h-4 w-4 text-slate-500" />
            <span>AI 自定义密钥设置</span>
          </button>
        </div>

        {/* Collapsible API Key settings panel */}
        {showKeyPanel && (
          <div className="mt-4 max-w-md mx-auto p-5 bg-white rounded-2xl border border-slate-200 shadow-xl text-left animate-fade-in relative z-20">
            <h3 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
              <Settings className="h-4 w-4 text-blue-600 animate-spin" style={{ animationDuration: "3s" }} />
              <span>客户端自主分析设置</span>
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              您可以在下面配置个人的 <strong>Gemini API Key</strong>。配置完成后，诊断时将从浏览器直接发送请求，无需依赖开发者后端中转，永久保存在本地安全沙盒中。
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="请输入以 AIzaSy 开头的 Gemini 密钥"
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={saveCustomKey}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-bold shadow"
              >
                保存设置
              </button>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
              <Info className="h-3 w-3 shrink-0" />
              <span>留空点击保存将恢复到系统的默认模拟引擎模式。</span>
            </div>
          </div>
        )}
      </section>

      {/* Scenario Categories */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 mb-10 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {types.map((type) => {
            const isSelected = quickType === type.value;
            return (
              <button
                key={type.value}
                onClick={() => {
                  setQuickType(type.value);
                  setQuickResult(null);
                  if (workbenchRef.current) {
                    workbenchRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
                className={cn(
                  "friendly-card p-4 text-left rounded-2xl border transition-all duration-200",
                  type.color,
                  isSelected 
                    ? "bg-white border-blue-500 ring-2 ring-blue-500/10 -translate-y-1 shadow-md" 
                    : ""
                )}
              >
                <div className="flex justify-between items-center mb-2.5">
                  <span className={cn(
                    "text-xs font-bold rounded-lg px-2 py-1 transition-colors",
                    isSelected ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {type.label.split(" ")[0]}
                  </span>
                  {isSelected && <div className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />}
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm sm:text-base mb-1">
                  {type.label.split(" ")[1]}
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                  {type.desc}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sandbox Workbench */}
      <section ref={workbenchRef} className="relative z-10 mx-auto max-w-3xl px-6 mb-12">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md">
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-800">第一步：描述您遇到的具体麻烦</h2>
                <p className="text-[11px] text-slate-400 font-sans">
                  当前类别：{types.find(t => t.value === quickType)?.label.split(" ")[1] || "常规帮助"}
                </p>
              </div>
            </div>

            {/* Mode switcher */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
              <button
                onClick={() => setMemberMode("normal")}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                  memberMode === "normal" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <User className="inline-block h-3.5 w-3.5 mr-1 text-slate-500" /> 标准版
              </button>
              <button
                onClick={() => setMemberMode("elder")}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                  (memberMode as string) === "elder" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <HeartHandshake className="inline-block h-3.5 w-3.5 mr-1" /> 大字关怀版
              </button>
            </div>
          </div>

          {/* Form input */}
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder={placeholders[quickType]}
                rows={4}
                className="w-full rounded-2xl friendly-input p-4 pb-14 text-sm text-slate-800 focus:outline-none resize-none transition-all placeholder:text-slate-400 leading-relaxed shadow-sm font-sans"
              />
              
              {/* Voice and OCR button row */}
              <div className="absolute left-3 bottom-3 flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={ocrLoading}
                  className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 flex items-center gap-1 shadow-sm font-sans font-bold"
                  title="拍照上传或选择截图"
                >
                  <Camera className="h-4 w-4 text-blue-600 animate-pulse" />
                  <span>{ocrLoading ? "读取中..." : "拍照识别文字"}</span>
                </button>
                
                <button
                  onClick={toggleListening}
                  className={cn(
                    "border rounded-xl px-3 py-1.5 text-xs flex items-center gap-1 shadow-sm font-sans font-bold select-none",
                    isListening 
                      ? "bg-rose-50 border-rose-400 text-rose-700 animate-pulse" 
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                  title="语音输入"
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-4 w-4 text-rose-600 animate-pulse" />
                      <div className="flex items-center gap-0.5 h-3 px-0.5 select-none">
                        <span className="w-0.5 h-2.5 bg-rose-500 rounded animate-wave-bar" style={{ animationDelay: '0.1s' }} />
                        <span className="w-0.5 h-2.5 bg-rose-500 rounded animate-wave-bar" style={{ animationDelay: '0.3s' }} />
                        <span className="w-0.5 h-2.5 bg-rose-500 rounded animate-wave-bar" style={{ animationDelay: '0.2s' }} />
                        <span className="w-0.5 h-2.5 bg-rose-500 rounded animate-wave-bar" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </>
                  ) : (
                    <Mic className="h-4 w-4 text-blue-600" />
                  )}
                  <span>{isListening ? "录音中..." : "按住说话"}</span>
                </button>
              </div>

              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-medium font-sans">
                  {quickInput.length} 字
                </span>
                <button
                  onClick={handleQuickAnalyze}
                  disabled={quickLoading || !quickInput.trim() || ocrLoading}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-bold disabled:opacity-40 disabled:pointer-events-none transition-all select-none shadow-md"
                >
                  {quickLoading ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>正在分析中...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 text-yellow-400" />
                      <span>开始智能分析</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end select-none">
              {renderStatusBadge(false)}
            </div>

            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleOcrUpload} 
              className="hidden" 
            />

            {/* AI thinking progress */}
            {quickLoading && (
              <div className="animate-fade-in rounded-2xl bg-blue-50/40 border border-blue-100 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    <span>{quickProgress}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-600">{Math.round(quickProgressPct * 100)}%</span>
                </div>
                <div className="risk-thermometer-track">
                  <div 
                    className="risk-thermometer-fill bg-blue-600" 
                    style={{ width: `${Math.round(quickProgressPct * 100)}%` }} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Analysis Result (Diagnostic Sheet) */}
      {quickResult && (
        <section ref={reportRef} className="relative z-10 mx-auto max-w-3xl px-6 mb-12 scroll-mt-20 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            
            {/* Header banner */}
            <div className="bg-blue-900 text-white px-6 py-5 sm:px-8 border-b border-blue-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center">
                    <FileCheck className="h-5 w-5 text-blue-200" />
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-300 font-mono tracking-wider">CLEARMATE 维权诊断书</span>
                    <h3 className="text-base font-black text-white leading-tight mt-0.5 font-sans">
                      检测结论：{quickResult.summary}
                    </h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* TTS Voice Readback button for Standard view */}
                  <button
                    onClick={() => speakReport(quickResult)}
                    className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 border border-white/10"
                    title="朗读报告"
                  >
                    {isPlayingVoice ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    <span>{isPlayingVoice ? "停止朗读" : "朗读结论"}</span>
                  </button>

                  {!loggedIn && (
                    <Link href="/register" className="shrink-0 inline-flex items-center gap-1.5 bg-white text-blue-900 rounded-xl px-4 py-2 text-xs font-bold hover:bg-slate-100 transition-all">
                      <span>保存该记录</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Content list */}
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Risk Meter Thermometer */}
              <div className={cn(
                "rounded-2xl p-4 border",
                RISK_CONFIG[quickResult.risk_level]?.bg || RISK_CONFIG.low.bg
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black flex items-center gap-1.5">
                    {(() => {
                      const IconComp = RISK_CONFIG[quickResult.risk_level]?.icon || RISK_CONFIG.low.icon;
                      return <IconComp className="h-5 w-5" />;
                    })()}
                    <span>风险等级：{RISK_CONFIG[quickResult.risk_level]?.label || "低风险"}</span>
                  </span>
                </div>
                <div className="risk-thermometer-track bg-slate-200/60 mb-2">
                  <div className={cn("risk-thermometer-fill", RISK_CONFIG[quickResult.risk_level]?.barColor || "bg-emerald-500")} style={{ width: `${RISK_CONFIG[quickResult.risk_level]?.barPct || 25}%` }} />
                </div>
                <p className="text-xs font-bold text-slate-700 mt-1 leading-relaxed font-sans">
                  💡 诊断建议：{RISK_CONFIG[quickResult.risk_level]?.advice}
                </p>
              </div>

              {/* Case Facts Grid */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 animate-scanline">
                <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5 font-sans">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>帮您梳理的事件事实 (Facts)</span>
                </h4>
                {quickResult.key_facts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {quickResult.key_facts.map((fact, idx) => (
                      <div key={idx} className="text-xs text-slate-600 bg-white border border-slate-200/60 rounded-xl px-3 py-2 leading-relaxed font-sans">
                        <strong className="text-blue-600 font-mono">要点 {idx + 1}：</strong>{fact}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">情况较为简单，未分析出复杂的涉案要素。</p>
                )}
              </div>

              {/* Action blueprint: Step 1, Step 2, Step 3 */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2 font-sans">
                  <Scale className="h-4 w-4 text-blue-500" />
                  <span>核心应对措施：维权行动三部曲 (Actions)</span>
                </h4>

                {/* Step 1: Evidence */}
                <div className="friendly-card p-4 rounded-2xl relative">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="step-card-circle h-6 w-6 rounded-full flex items-center justify-center text-xs">1</span>
                    <h5 className="text-xs font-black text-slate-800">第一步：保留并截屏以下证据</h5>
                  </div>
                  {quickResult.evidence_checklist.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {quickResult.evidence_checklist.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl text-xs text-slate-600">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic font-sans">暂无专门的取证清单推荐。</p>
                  )}
                </div>

                {/* Step 2: Negotiations / Counter Scripts */}
                <div className="friendly-card p-4 rounded-2xl relative">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="step-card-circle h-6 w-6 rounded-full flex items-center justify-center text-xs">2</span>
                    <h5 className="text-xs font-black text-slate-800">第二步：直接复制这些话术去对峙谈判</h5>
                  </div>
                  
                  {quickResult.counter_scripts.length > 0 ? (
                    <div className="space-y-3">
                      {quickResult.counter_scripts.map((script, idx) => {
                        const merchantMocks: Record<string, string> = {
                          scam_check: "商家/骗子常用借口：“保证金只是代收的，需要您再完成一次转账才可以全额原路退还给您。”",
                          refund_request: "商家常用借口：“由于升级故障导致我们这边无法发货，请您加我们客服微信以领退款红包。”",
                          document_review: "商家常用借口：“合同是法务拟好的格式条款，我们对谁都是这么签署的，放心，实际不会较真。”",
                          subscription_cancel: "APP客服借口：“由于包月优惠政策限制，中途无法申请退订，必须在下个月扣款后才能处理。”",
                        };
                        const mockMsg = merchantMocks[quickType] || "对方推诿借口：“这是公司规定，我们目前无法为您处理退款，请您耐心再等几天。”";
                        
                        return (
                          <div key={idx} className="space-y-2 border-t border-slate-100 pt-3 first:border-0 first:pt-0">
                            {/* Merchant mock */}
                            <div className="flex items-start gap-2 max-w-[85%]">
                              <div className="h-6 w-6 rounded bg-slate-100 text-[10px] font-bold text-slate-500 flex items-center justify-center shrink-0">
                                诉
                              </div>
                              <div className="bg-slate-100 p-2.5 rounded-xl rounded-tl-none text-xs text-slate-600 leading-relaxed font-medium">
                                {mockMsg}
                              </div>
                            </div>
                            
                            {/* User script */}
                            <div className="flex items-start gap-2 max-w-[85%] ml-auto justify-end">
                              <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl rounded-tr-none text-xs text-blue-900 leading-relaxed relative group">
                                <div className="pr-6 font-bold">{script}</div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(script);
    setToastMessage("对线话术已复制！");
    setShowToast(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
                                    setTimeout(() => setShowToast(false), 2000);
                                  }}
                                  className="absolute right-2 top-2 p-1.5 rounded-lg border border-blue-200 bg-white text-blue-500 hover:bg-blue-50 hover:border-blue-300 transition-all opacity-0 group-hover:opacity-100"
                                  title="复制话术"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="h-6 w-6 rounded bg-blue-600 text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                                我
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic font-sans">此场景建议多收集发票合同等凭证，无需过度口头理论。</p>
                  )}
                </div>

                {/* Step 3: Appeal template */}
                {quickResult.templates.length > 0 && (
                  <div className="friendly-card p-4 rounded-2xl relative">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="step-card-circle h-6 w-6 rounded-full flex items-center justify-center text-xs">3</span>
                      <h5 className="text-xs font-black text-slate-800">第三步：复制正式的书面维权信去平台或12315申诉</h5>
                    </div>
                    
                    {quickResult.templates.map((tpl, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-700">{tpl.title}</span>
                          <button
                            onClick={() => triggerCopy(autoFillTemplate(tpl.content, quickInput), idx)}
                            className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-[10px] font-bold text-blue-600"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-600">已成功复制</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>复制信件全文</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-4 bg-white">
                          {/* Lined letter paper autofilled */}
                          <div className="letter-paper rounded-lg p-4 font-sans text-xs sm:text-sm text-slate-700">
                            {autoFillTemplate(tpl.content, quickInput).split("\n").map((line, lIdx) => (
                              <p key={lIdx} className="min-h-[2.2rem]">
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Auto-renew cancel visual steps guide carousel */}
              {(quickType === "subscription_cancel" || quickResult.summary.includes("包月") || quickResult.summary.includes("续费") || quickResult.summary.includes("扣费")) && (
                <div className="friendly-card p-5 rounded-2xl bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 font-sans">
                    <HelpCircle className="h-5 w-5 text-amber-500 animate-bounce" />
                    <span>自动扣费取消步骤真机画面对照指南</span>
                  </h4>
                  
                  {/* Guide tabs */}
                  <div className="flex border-b border-slate-200 mb-4">
                    {[
                      { id: "wechat", label: "微信支付" },
                      { id: "alipay", label: "支付宝" },
                      { id: "apple", label: "苹果手机 (iOS)" },
                      { id: "android", label: "安卓手机 (华为等)" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveGuideTab(tab.id as any)}
                        className={cn(
                          "flex-1 pb-2 text-xs font-bold border-b-2 font-sans transition-all",
                          activeGuideTab === tab.id 
                            ? "border-blue-600 text-blue-600" 
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Guide content visual rendering */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 font-sans text-xs space-y-3.5">
                    {activeGuideTab === "wechat" && (
                      <>
                        <p className="font-extrabold text-slate-800 border-b pb-1.5">微信支付自动续费取消路径：</p>
                        <div className="space-y-2 pl-3 border-l-2 border-blue-500">
                          <p>1️⃣ 打开<strong>微信</strong> ➔ 点击右下角 <strong>我</strong> ➔ 选择 <strong>服务</strong></p>
                          <p>2️⃣ 点击 <strong>钱包</strong> ➔ 页面最下方选择 <strong>支付设置</strong> 或 <strong>消费者保护</strong></p>
                          <p>3️⃣ 进入 <strong>自动扣费</strong> ➔ 选择对应的软件服务项目 ➔ 点击 <strong>关闭服务</strong></p>
                        </div>
                      </>
                    )}
                    {activeGuideTab === "alipay" && (
                      <>
                        <p className="font-extrabold text-slate-800 border-b pb-1.5">支付宝免密扣费取消路径：</p>
                        <div className="space-y-2 pl-3 border-l-2 border-blue-500">
                          <p>1️⃣ 打开<strong>支付宝</strong> ➔ 点击右下角 <strong>我的</strong> ➔ 点击右上角 <strong>齿轮(设置)</strong></p>
                          <p>2️⃣ 找到并点击 <strong>支付设置</strong> ➔ 选择 <strong>免密支付/自动扣款</strong></p>
                          <p>3️⃣ 找到对应的续费项目 ➔ 点击 <strong>关闭服务</strong> ➔ 确认解除授权</p>
                        </div>
                      </>
                    )}
                    {activeGuideTab === "apple" && (
                      <>
                        <p className="font-extrabold text-slate-800 border-b pb-1.5">苹果 App Store 自动扣费取消路径：</p>
                        <div className="space-y-2 pl-3 border-l-2 border-blue-500">
                          <p>1️⃣ 打开手机 <strong>设置</strong> ➔ 点击顶部 <strong>您的 Apple ID (头像姓名)</strong></p>
                          <p>2️⃣ 选择 <strong>订阅</strong></p>
                          <p>3️⃣ 找到正在扣费的软件 ➔ 点击 <strong>取消订阅</strong></p>
                        </div>
                      </>
                    )}
                    {activeGuideTab === "android" && (
                      <>
                        <p className="font-extrabold text-slate-800 border-b pb-1.5">安卓手机应用商店订阅退订路径：</p>
                        <div className="space-y-2 pl-3 border-l-2 border-blue-500">
                          <p>1️⃣ 打开 <strong>应用市场/应用商店</strong> ➔ 点击 <strong>我的(个人中心)</strong> ➔ 选择 <strong>设置/帐号中心</strong></p>
                          <p>2️⃣ 点击 <strong>付款与账单</strong> ➔ 找到 <strong>自动续费/免密扣款</strong></p>
                          <p>3️⃣ 选择对应服务 ➔ 点击 <strong>停止续费</strong> 确认关闭</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Help channels */}
              {quickResult.help_channels.length > 0 && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                  <h4 className="text-xs font-bold text-blue-800 mb-3 flex items-center gap-1.5">
                    <PhoneCall className="h-5 w-5 text-blue-600" />
                    <span>第四步：向这些官方平台拨打热线或提交投诉</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quickResult.help_channels.map((ch, idx) => (
                      <div key={idx} className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-sm">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{ch.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{ch.desc}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/^\d+$/.test(ch.contact) ? (
                            <a 
                              href={`tel:${ch.contact}`} 
                              className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold px-3 py-1.5 rounded-lg text-[10px]"
                            >
                              拨打 {ch.contact}
                            </a>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px]">
                              {ch.contact}
                            </span>
                          )}
                          {ch.url && (
                            <a 
                              href={ch.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-slate-400 hover:text-slate-600"
                              title="打开官网"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="pt-2 flex items-start gap-2 text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 font-sans">
                <Info className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                <span>{quickResult.disclaimer}</span>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* Floating Action entryways & Toggle Switch */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { href: "/avoid-pit", icon: "🛡️", label: "避坑防骗知识库" },
            { href: "/self-check", icon: "✅", label: "做选择题评估风险" },
            { href: "/tasks/new?document_review", icon: "📄", label: "看懂霸王条款" },
            { href: "/tasks/new?subscription_cancel", icon: "🔓", label: "查询连续包月" },
          ].map((t, idx) => (
            <Link
              key={idx}
              href={t.href}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </Link>
          ))}
        </div>
        
        <button
          onClick={toggleElderMode}
          className="rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 px-4 py-2.5 text-xs font-bold transition-all shadow-md shrink-0"
        >
          {isElder ? "🔤 切换至标准字号" : "👵 开启大字关怀模式"}
        </button>
      </section>

      {/* Custom micro-toast alert */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-slate-900/90 backdrop-blur text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border border-white/10">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 animate-bounce" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

    </div>
  );
}

