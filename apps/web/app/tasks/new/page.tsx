"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mic, MicOff, ChevronLeft, Upload, FileText, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { createTask, saveAnalysis } from "@/lib/local-store";
import { useRequireAuth } from "@/lib/use-require-auth";
import { unifiedAnalyze } from "@/lib/unified-analyze";
import { analyzeWithProgress } from "@/lib/analyze-progress";
import { useToast } from "@/components/ui/toast";
import { ThinkingSteps } from "@/components/ui/thinking-steps";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils";

const TASK_TYPES = [
  { value: "scam_check", emoji: "🔍", label: "这是不是坑？", desc: "判断短信、广告、兼职是否为诈骗或套路", tone: "bg-rose-100 dark:bg-rose-900/40" },
  { value: "refund_request", emoji: "💰", label: "退款/投诉/取消", desc: "自动生成客服申诉信、投诉申请及反制话术", tone: "bg-amber-100 dark:bg-amber-900/40" },
  { value: "subscription_cancel", emoji: "🔓", label: "订阅陷阱", desc: "智能匹配平台隐藏续费规则与退订路径", tone: "bg-violet-100 dark:bg-violet-900/40" },
  { value: "document_review", emoji: "📄", label: "看懂文件", desc: "提取长文档、协议、电子账单的核心信息与猫腻", tone: "bg-sky-100 dark:bg-sky-900/40" },
  { value: "general_life_issue", emoji: "📋", label: "其他问题", desc: "描述您面临的其他生活事务/消费纠纷", tone: "bg-stone-100 dark:bg-stone-700/50" },
];

const ACCEPTED_FILE_TYPES = [
  "text/plain", "text/csv", "text/markdown",
  "application/pdf",
  "image/png", "image/jpeg", "image/webp",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function NewTaskForm() {
  useRequireAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const getPreselected = () => {
    const typeParam = searchParams.get("type");
    if (typeParam && TASK_TYPES.some(t => t.value === typeParam)) return typeParam;
    const keyParam = TASK_TYPES.find(t => searchParams.has(t.value))?.value;
    return keyParam || "scam_check";
  };

  const [taskType, setTaskType]         = useState(getPreselected());
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const { toast } = useToast();
  const [progress, setProgress]         = useState("");
  const [progressPct, setProgressPct]   = useState(0);
  const [fileParsing, setFileParsing]   = useState(false);
  const [fileName, setFileName]         = useState("");
  const [fileContent, setFileContent]   = useState("");
  const [isListening, setIsListening]   = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    document.title = "新建维权任务 - ClearMate";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "zh-CN";
      rec.onresult = (e: any) => {
        const transcript = e.results[e.results.length - 1][0].transcript;
        setDescription(prev => prev + (prev ? " " : "") + transcript);
      };
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  function beep(frequency: number, duration: number) {
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
    } catch {}
  }

  function toggleListening() {
    if (!recognitionRef.current) {
      toast.error("不支持语音输入", "当前浏览器不支持 SpeechRecognition 接口");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      beep(440, 0.12);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      beep(660, 0.12);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_FILE_TYPES.includes(file.type) && !file.name.endsWith(".txt") && !file.name.endsWith(".md") && !file.name.endsWith(".csv")) {
      setError("不支持此文件类型，请上传 txt、pdf 或常见图片格式");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("上传文件体积不能超过 5MB");
      return;
    }

    setError("");
    setFileName(file.name);
    setFileParsing(true);

    try {
      let text = "";
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        try {
          const pdfjsLib = await import("pdfjs-dist");
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
          }
          text = fullText.trim();
        } catch {
          text = extractTextFromPDFBuffer(arrayBuffer);
        }
        if (!text.trim()) {
          text = `[PDF文件: ${file.name}，共 ${(file.size / 1024).toFixed(1)}KB]\n\n⚠️ 该 PDF 属于扫描版，暂无法直接抓取文字。\n建议手动键入或粘贴合同核心条款：\n- 交付与返还金额\n- 违约责任与限制`;
        }
      } else if (file.type.startsWith("image/")) {
        try {
          const { createWorker } = await import("tesseract.js");
          const worker = await createWorker("chi_sim");
          const ret    = await worker.recognize(file);
          await worker.terminate();
          text = ret.data.text.trim();
          if (!text) {
            text = `[图片文件: ${file.name}，${(file.size / 1024).toFixed(1)}KB]\n\n⚠️ 文字识别结果为空。请手动填入图片中的具体内容。`;
          }
        } catch {
          text = `[图片文件: ${file.name}，${(file.size / 1024).toFixed(1)}KB]\n\n⚠️ 智能 OCR 组件加载失败。请手动描述此处关键内容。`;
        }
      } else {
        text = await file.text();
      }

      setFileContent(text);
      setDescription(prev => {
        const separator = prev ? "\n\n--- 附件文档内容 ---\n" : "--- 附件文档内容 ---\n";
        if (prev.includes("--- 附件文档内容 ---")) {
          return prev.replace(/--- 附件文档内容 ---[\s\S]*/, `${separator}${text}`);
        }
        return prev + separator + text;
      });

      if (!title) {
        setTitle(`看懂文件: ${file.name.replace(/\.[^.]+$/, "")}`);
      }
      setTaskType("document_review");
    } catch (err: any) {
      setError(`文件读取失败: ${err.message || "未知异常"}`);
    } finally {
      setFileParsing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskType) { setError("请先选择任务类别"); return; }
    setError("");
    setLoading(true); setProgress(""); setProgressPct(0);
    try {
      const taskTitle = title || "新任务";
      const task      = createTask({ title: taskTitle, task_type: taskType, description });
      const result    = await analyzeWithProgress(
        () => unifiedAnalyze(taskType, taskTitle, description),
        taskType,
        (step, pct) => { setProgress(step); setProgressPct(pct); }
      );
      const prov  = result._provider || "client-mock";
      const model = result._model || "v2";
      saveAnalysis(task.id, result, prov, model);
      if (result._error) toast.error("分析警告", result._error);
      router.push(`/tasks/detail?id=${task.id}`);
    } catch (err: any) {
      setError(err.message || "任务创建失败");
      setLoading(false);
    }
  }

  const isDocReview = taskType === "document_review";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900/50 p-4 animate-shake">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Type selection */}
      <FormField label="选择任务类型">
        <div className="grid gap-3 sm:grid-cols-2">
          {TASK_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTaskType(t.value)}
              className={cn(
                "group rounded-2xl border-2 p-4 text-left transition-all relative flex flex-col",
                taskType === t.value
                  ? "bg-brand-50/50 dark:bg-brand-950/20 border-brand-500 dark:border-brand-700 shadow-md"
                  : "bg-surface-0 border-border hover:border-border-strong"
              )}
            >
              <div className={cn(
                "mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl text-base transition-all group-hover:scale-105",
                t.tone
              )}>
                {t.emoji}
              </div>
              <h3 className="text-sm font-bold text-fg-primary">{t.label}</h3>
              <p className="mt-1 text-xs text-fg-muted leading-normal">{t.desc}</p>
            </button>
          ))}
        </div>
      </FormField>

      {/* Upload Zone */}
      {isDocReview && (
        <div className="rounded-2xl border-2 border-dashed border-brand-200 dark:border-brand-800/50 bg-brand-50/30 dark:bg-brand-950/10 p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Upload className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-brand-700 dark:text-brand-400">上传协议 / 账单文件</h3>
          </div>
          <p className="text-xs text-brand-600/80 dark:text-brand-400/70 leading-normal">
            支持 .txt, .pdf, .jpg, .png, .webp (智能 OCR 会自动分析并提取图片中的合同文本) · 单文件最大 5MB
          </p>
          <div className="flex items-center gap-3">
            <label className="btn btn-sm btn-primary cursor-pointer">
              {fileParsing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> 解析中
                </>
              ) : "选取本地文件"}
              <input type="file" onChange={handleFileUpload} accept=".txt,.md,.csv,.pdf,.png,.jpg,.jpeg,.webp" className="hidden" disabled={fileParsing} />
            </label>
            {fileName && (
              <span className="text-xs font-semibold text-fg-secondary flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> {fileName}
                {fileContent.includes("⚠️") && <span className="text-amber-600">(需补充文字说明)</span>}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Title */}
      <FormField label="任务标题" htmlFor="title" required>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={
            isDocReview
              ? "例如：某某平台租房合规审查"
              : taskType === "scam_check"
              ? "例如：二手闲置买家以保证金要求转账"
              : taskType === "refund_request"
              ? "例如：某健身房自动续费扣款退款纠纷"
              : "输入该维权事项的简短名字"
          }
          className="input-field"
        />
      </FormField>

      {/* Description */}
      <FormField
        label={isDocReview ? "文件条款详情 / 疑问说明" : "遭遇详情描述"}
        htmlFor="description"
        required
      >
        <div className="relative">
          <Textarea
            id="description"
            rows={8}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={
              isDocReview
                ? "您可在此填入提取出的文档条款，或直接粘贴协议原文..."
                : "请在此描述您的具体遭遇，包含关键节点：对方角色、交易链路、提出的转账或付款理由、当前处理节点等..."
            }
            className="pb-14"
          />

          {/* Audio STT */}
          <div className="absolute left-3 bottom-3 select-none">
            <button
              type="button"
              onClick={toggleListening}
              className={cn(
                "btn btn-sm text-xs rounded-xl font-bold",
                isListening
                  ? "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 animate-pulse"
                  : "btn-secondary"
              )}
            >
              {isListening ? (
                <>
                  <MicOff className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  <span>录音中...</span>
                  <div className="flex gap-0.5 h-3 items-center">
                    <span className="w-0.5 h-2 bg-rose-500 rounded animate-wave-bar" />
                    <span className="w-0.5 h-2 bg-rose-500 rounded animate-wave-bar" style={{ animationDelay: '0.2s' }} />
                    <span className="w-0.5 h-2 bg-rose-500 rounded animate-wave-bar" style={{ animationDelay: '0.1s' }} />
                  </div>
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                  <span>语音转录</span>
                </>
              )}
            </button>
          </div>
        </div>
        {fileContent && (
          <p className="text-[11px] text-fg-faint">文档条款已自动汇入输入框，您可进行调整补充。</p>
        )}
      </FormField>

      {/* Loading & thinking steps */}
      {loading && progress ? (
        <div className="card rounded-xl p-5 border border-brand-100 dark:border-brand-900/50 bg-brand-50/20 dark:bg-brand-950/10">
          <ThinkingSteps currentStep={progress} progress={progressPct} />
        </div>
      ) : (
        <Button type="submit" disabled={loading || !taskType} variant="primary" size="lg" fullWidth leftIcon={<ShieldCheck className="h-5 w-5" />}>
          提交任务并运行 AI 诊断
        </Button>
      )}
    </form>
  );
}

// Simple extractor
function extractTextFromPDFBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let raw = "";
  try { raw = new TextDecoder("utf-8", { fatal: false }).decode(bytes); } catch { return ""; }
  const textParts: string[] = [];
  const btEtRegex = /BT\s([\s\S]*?)\sET/g;
  let match;
  while ((match = btEtRegex.exec(raw)) !== null) {
    const block = match[1];
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      textParts.push(tjMatch[1]);
    }
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
    let tjArrMatch;
    while ((tjArrMatch = tjArrayRegex.exec(block)) !== null) {
      const arr = tjArrMatch[1];
      const strRegex = /\(([^)]*)\)/g;
      let strMatch;
      while ((strMatch = strRegex.exec(arr)) !== null) {
        textParts.push(strMatch[1]);
      }
    }
  }
  return textParts.join(" ").trim();
}

export default function NewTaskPage() {
  return (
    <div className="min-h-screen page-bg">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12 space-y-6 animate-fade-in-up">

        <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
          <ChevronLeft className="h-4 w-4" /> 返回任务列表
        </Link>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-fg-primary">🛡️ 发起维权诊断</h1>
          <p className="mt-1 text-sm text-fg-muted">选择分类，上传或描述凭证，AI 将秒级输出抗辩策略</p>
        </div>

        <div className="card rounded-2xl p-5 sm:p-6">
          <Suspense fallback={
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            </div>
          }>
            <NewTaskForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
