"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  ScanSearch, RefreshCw, BadgeX, FileText, Mic, MicOff,
  Sparkles, ChevronRight, Loader2, Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { ThinkingSteps } from "@/components/ui/thinking-steps";
import { AnalysisResultView } from "@/components/features/analysis-result";
import { unifiedAnalyze } from "@/lib/unified-analyze";
import { analyzeWithProgress } from "@/lib/analyze-progress";
import type { AnalysisResult, ImageAttachment } from "@/types";

const TASK_TYPES = [
  { id: "scam_check",          label: "这是骗局吗？",  icon: ScanSearch,  color: "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300",       desc: "短信、广告、投资、兼职" },
  { id: "refund_request",      label: "退款/投诉",    icon: RefreshCw,   color: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300",   desc: "购物纠纷、退款申请" },
  { id: "subscription_cancel", label: "订阅陷阱",     icon: BadgeX,      color: "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300", desc: "自动续费、隐藏扣款" },
  { id: "document_review",     label: "看懂文件",     icon: FileText,    color: "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300",           desc: "合同、账单、通知" },
];

interface AnalysisWorkbenchProps {
  isElder?: boolean;
  className?: string;
  /** 由外部"试试示例"注入的样例文本 */
  sampleText?: string;
  /** 样例注入触发 nonce（变化时载入） */
  sampleNonce?: number;
  onSampleConsumed?: () => void;
}

export function AnalysisWorkbench({ isElder, className, sampleText, sampleNonce, onSampleConsumed }: AnalysisWorkbenchProps) {
  const [taskType,    setTaskType]    = useState("scam_check");
  const [inputText,   setInputText]   = useState("");
  const [images,      setImages]      = useState<ImageAttachment[]>([]);
  const [showImages,  setShowImages]  = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [progress,    setProgress]    = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [result,      setResult]      = useState<AnalysisResult | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const resultRef      = useRef<HTMLDivElement>(null);

  const getImageContext = useCallback(() => {
    const ocrTexts = images.filter(i => i.ocrText).map(i => `[图片 ${i.fileName}]\n${i.ocrText}`);
    return ocrTexts.length > 0 ? "\n\n[图片识别内容]\n" + ocrTexts.join("\n---\n") : "";
  }, [images]);

  const handleAnalyze = useCallback(async () => {
    const text = (inputText + getImageContext()).trim();
    if (!text) return;
    const selectedType = TASK_TYPES.find((t) => t.id === taskType);
    const title = selectedType ? `${selectedType.label} - 即时分析` : "即时风险分析";

    setLoading(true);
    setResult(null);
    setProgress("");
    setProgressPct(0);

    const r = await analyzeWithProgress(
      () => unifiedAnalyze(taskType, title, text),
      taskType,
      (step, pct) => {
        setProgress(step);
        setProgressPct(pct);
      }
    );

    setResult(r);
    setLoading(false);

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }, [inputText, taskType, getImageContext]);

  const toggleVoice = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "zh-CN";
    rec.onresult = (e: any) => {
      const t = e.results[e.results.length - 1][0].transcript;
      setInputText(prev => prev + (prev ? " " : "") + t);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
  }, [isListening]);

  const handleOcrExtract = useCallback((id: string, text: string) => {
    setInputText(prev => prev + (prev ? "\n" : "") + text);
  }, []);

  // 外部注入样例（首页"试试示例"）
  useEffect(() => {
    if (sampleNonce && sampleText) {
      setInputText(sampleText);
      onSampleConsumed?.();
    }
  }, [sampleNonce, sampleText, onSampleConsumed]);

  const canSubmit = (inputText.trim().length > 0 || images.some(i => i.ocrText)) && !loading;
  const totalContext = inputText + getImageContext();

  return (
    <div className={cn("space-y-5", className)}>
      {/* ── Task Type Selector ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TASK_TYPES.map(({ id, label, icon: Icon, color, desc }) => {
          const active = taskType === id;
          return (
            <button
              key={id}
              onClick={() => setTaskType(id)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl p-3 sm:p-4 text-center transition-all duration-200 border-2",
                active
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40 shadow-glow-sm"
                  : "border-border bg-surface-0 hover:border-border-strong",
                isElder && "p-4 sm:p-5"
              )}
            >
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-all", color)}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn(
                "font-semibold leading-tight",
                isElder ? "text-sm" : "text-xs sm:text-sm",
                active ? "text-brand-700 dark:text-brand-300" : "text-fg-secondary"
              )}>{label}</span>
              <span className={cn("text-fg-faint hidden sm:block", isElder ? "text-xs" : "text-[10px]")}>{desc}</span>

              {active && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Main Input Card ── */}
      <div className="card rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <span className={cn("text-xs font-medium text-fg-faint mr-auto", isElder && "text-sm")}>
            粘贴内容 / 语音输入 / 上传截图，描述您的遭遇
          </span>

          {/* Voice */}
          <button
            onClick={toggleVoice}
            title={isListening ? "停止录音" : "语音输入"}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
              isListening
                ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
                : "text-fg-muted hover:bg-surface-2"
            )}
          >
            {isListening ? (
              <>
                <div className="flex items-end gap-0.5 h-4">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="voice-bar h-3 w-1" style={{ animationDelay: `${i * 100}ms` }} />
                  ))}
                </div>
                <MicOff className="h-3.5 w-3.5" />
                停止
              </>
            ) : (
              <>
                <Mic className="h-3.5 w-3.5" />
                语音
              </>
            )}
          </button>

          {/* Image toggle */}
          <button
            onClick={() => setShowImages(v => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
              showImages || images.length > 0
                ? "bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300"
                : "text-fg-muted hover:bg-surface-2"
            )}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            截图{images.length > 0 ? ` (${images.length})` : ""}
          </button>
        </div>

        {/* Textarea */}
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={
            taskType === "scam_check"          ? "粘贴您收到的短信、聊天记录、广告截图文字，或描述遭遇的情况..." :
            taskType === "refund_request"      ? "描述您的退款/投诉情况，包括商家名称、金额、问题经过..." :
            taskType === "subscription_cancel" ? "粘贴扣款通知、订阅确认邮件，或描述您的订阅情况..." :
            "粘贴合同条款、账单通知、合同文件内容，或描述文件主要内容..."
          }
          rows={isElder ? 6 : 5}
          className={cn(
            "w-full resize-none border-0 bg-transparent px-4 py-3 outline-none",
            "text-fg-primary placeholder:text-fg-faint",
            isElder ? "text-lg leading-relaxed" : "text-sm leading-relaxed"
          )}
          disabled={loading}
        />

        {/* Image upload area */}
        {(showImages || images.length > 0) && (
          <div className="border-t border-border px-4 py-3">
            <ImageUpload
              images={images}
              onChange={setImages}
              onOcrExtract={handleOcrExtract}
              maxImages={6}
              disabled={loading}
            />
          </div>
        )}

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <span className={cn(
              "text-xs text-fg-faint tabular-nums",
              totalContext.length > 3000 && "text-amber-500"
            )}>
              {totalContext.length} 字符
            </span>
            {images.length > 0 && (
              <span className="text-xs text-brand-500 dark:text-brand-400">
                {images.length} 张图片已附加
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(inputText || images.length > 0) && !loading && (
              <button
                onClick={() => { setInputText(""); setImages([]); setResult(null); setShowImages(false); }}
                className="text-xs text-fg-faint hover:text-fg-secondary transition-colors"
              >
                清除
              </button>
            )}
            <Button
              onClick={handleAnalyze}
              disabled={!canSubmit}
              variant="primary"
              size={isElder ? "lg" : "md"}
              leftIcon={loading ? undefined : <Sparkles className="h-4 w-4" />}
              loading={loading}
            >
              {loading ? "分析中..." : "开始智能分析"}
              {!loading && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Analysis Progress ── */}
      {loading && (
        <div className="card rounded-2xl p-5 animate-fade-in">
          <ThinkingSteps currentStep={progress} progress={progressPct} isElder={isElder} />
        </div>
      )}

      {/* ── Result ── */}
      {result && !loading && (
        <div ref={resultRef} className="animate-fade-in-up">
          <AnalysisResultView result={result} isElder={isElder} showProvider />
        </div>
      )}
    </div>
  );
}
