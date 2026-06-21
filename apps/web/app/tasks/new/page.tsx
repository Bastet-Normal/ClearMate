"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mic, MicOff } from "lucide-react";
import Link from "next/link";
import { createTask, saveAnalysis } from "@/lib/local-store";
import { unifiedAnalyze } from "@/lib/unified-analyze";
import { analyzeWithProgress } from "@/lib/analyze-progress";
import { useToast } from "@/components/ui/toast";

const TASK_TYPES = [
  { value: "scam_check", label: "🔍 这是不是坑？", desc: "判断短信、广告、兼职是否诈骗", gradient: "from-red-500 to-orange-500" },
  { value: "refund_request", label: "💰 退款/投诉/取消", desc: "生成投诉信、退款申请、客服话术", gradient: "from-amber-500 to-yellow-500" },
  { value: "subscription_cancel", label: "🔓 订阅陷阱", desc: "识别自动续费陷阱，给出取消路径", gradient: "from-pink-500 to-rose-500" },
  { value: "document_review", label: "📄 看懂文件", desc: "上传文件或粘贴文本，AI 提取关键信息", gradient: "from-blue-500 to-cyan-500" },
  { value: "general_life_issue", label: "📋 其他生活问题", desc: "描述你的问题，AI 帮你分析", gradient: "from-slate-500 to-slate-600" },
];

const ACCEPTED_FILE_TYPES = [
  "text/plain", "text/csv", "text/markdown",
  "application/pdf",
  "image/png", "image/jpeg", "image/webp",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function NewTaskForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = TASK_TYPES.find((t) => searchParams.has(t.value))?.value || "";
  const [taskType, setTaskType] = useState(preselected);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [analyzeProgress, setAnalyzeProgress] = useState("");
  const [analyzeProgressPct, setAnalyzeProgressPct] = useState(0);
  const [fileParsing, setFileParsing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    document.title = "新建维权任务 - ClearMate";
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
          setDescription(prev => prev + (prev ? " " : "") + transcript);
        };
        
        rec.onend = () => {
          setIsListening(false);
        };
        
        rec.onerror = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = rec;
      }
    }
  }, []);

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

  function toggleListening() {
    if (!recognitionRef.current) {
      alert("抱歉，您的浏览器不支持语音输入。");
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

  // 客户端文件读取
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_FILE_TYPES.includes(file.type) && !file.name.endsWith(".txt") && !file.name.endsWith(".md") && !file.name.endsWith(".csv")) {
      setError("不支持的文件类型，请上传 txt、pdf 或图片文件");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("文件不能超过 5MB");
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
            const pageText = textContent.items.map((item: any) => item.str).join(" ");
            fullText += pageText + "\n";
          }
          text = fullText.trim();
        } catch (pdfErr) {
          console.error("PDF.js text extraction failed, fallback to basic parser", pdfErr);
          text = extractTextFromPDFBuffer(arrayBuffer);
        }
        if (!text.trim()) {
          text = `[PDF文件: ${file.name}，共 ${(file.size / 1024).toFixed(1)}KB]\n\n⚠️ 此 PDF 为扫描件或图片型 PDF，无法直接提取文字。\n请手动输入或粘贴文件中的关键内容，例如：\n- 合同金额和日期\n- 违约条款\n- 不理解的条款原文`;
        }
      } else if (file.type.startsWith("image/")) {
        // 图片：使用 Tesseract OCR 提取文字
        try {
          const { createWorker } = await import("tesseract.js");
          const worker = await createWorker("chi_sim");
          const ret = await worker.recognize(file);
          await worker.terminate();
          text = ret.data.text.trim();
          if (!text) {
            text = `[图片文件: ${file.name}，${(file.size / 1024).toFixed(1)}KB]\n\n⚠️ 识别结束，但未从图片中提取出清晰的文字。请手动在此输入或粘贴关键内容。`;
          }
        } catch (ocrErr) {
          console.error("OCR extraction failed in tasks/new", ocrErr);
          text = `[图片文件: ${file.name}，${(file.size / 1024).toFixed(1)}KB]\n\n⚠️ 图片文字自动提取失败。请手动在此输入或粘贴关键内容。`;
        }
      } else {
        // 纯文本文件直接读取
        text = await file.text();
      }

      setFileContent(text);
      // 自动拼接到描述
      setDescription((prev) => {
        const separator = prev ? "\n\n--- 文件内容 ---\n" : "--- 文件内容 ---\n";
        // 如果之前已有文件内容，替换；否则追加
        if (prev.includes("--- 文件内容 ---")) {
          return prev.replace(/--- 文件内容 ---[\s\S]*/, `${separator}${text}`);
        }
        return prev + separator + text;
      });

      // 自动设置标题（如果为空）
      if (!title) {
        const baseName = file.name.replace(/\.[^.]+$/, "");
        setTitle(`看懂文件: ${baseName}`);
      }
      // 自动设置类型为 document_review
      if (!taskType) setTaskType("document_review");
    } catch (err: any) {
      setError(`文件读取失败: ${err.message || "未知错误"}`);
    } finally {
      setFileParsing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskType) { setError("请选择任务类型"); return; }
    setError("");
    setLoading(true);
    setAnalyzeProgress("");
    setAnalyzeProgressPct(0);
    try {
      const taskTitle = title || "新任务";
      const task = createTask({ title: taskTitle, task_type: taskType, description });
      const result = await analyzeWithProgress(
        () => unifiedAnalyze(taskType, taskTitle, description),
        taskType,
        (step, pct) => { setAnalyzeProgress(step); setAnalyzeProgressPct(pct); }
      );
      const provider = result._provider || "client-mock";
      const model = result._model || "client-v2";
      saveAnalysis(task.id, result, provider, model);
      if (result._error) {
        showToast(result._error, "error");
      }
      router.push(`/tasks/detail?id=${task.id}`);
    } catch (err: any) { setError(err.message || "创建失败"); } finally { setLoading(false); }
  }

  const isDocReview = taskType === "document_review";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-100">{error}</div>}

      {/* 类型选择 */}
      <div>
        <label className="mb-3 block text-sm font-medium text-slate-700">选择类型</label>
        <div className="grid gap-4 sm:grid-cols-2">
          {TASK_TYPES.map((t) => (
            <button key={t.value} type="button" onClick={() => setTaskType(t.value)}
              className={`rounded-2xl border-2 p-5 text-left transition-all ${taskType === t.value ? "border-brand-400 bg-brand-50 shadow-lg shadow-brand-500/10" : "border-slate-100 bg-white hover:border-slate-200"}`}>
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${t.gradient} text-xl text-white shadow-lg`}>{t.label.split(" ")[0]}</div>
              <div className="text-base font-bold text-slate-800">{t.label}</div>
              <div className="mt-1 text-xs text-slate-500">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 文件上传区 — document_review 时突出显示 */}
      {isDocReview && (
        <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
          <h3 className="mb-2 text-sm font-bold text-blue-700">📎 上传文件</h3>
          <p className="mb-4 text-xs text-blue-500">支持 txt、pdf、图片（图片可自动提取文字）· 最大 5MB</p>
          <div className="flex items-center gap-3">
            <label className="btn-primary cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg shadow-brand-500/25">
              {fileParsing ? "读取中..." : "选择文件"}
              <input type="file" onChange={handleFileUpload} accept=".txt,.md,.csv,.pdf,.png,.jpg,.jpeg,.webp" className="hidden" disabled={fileParsing} />
            </label>
            {fileName && (
              <span className="text-sm text-slate-600">
                ✅ {fileName}
                {fileContent.startsWith("[图片文件") && <span className="ml-1 text-amber-600">(需手动输入文字)</span>}
                {fileContent.includes("⚠️ 此 PDF 为扫描件") && <span className="ml-1 text-amber-600">(扫描件，需手动输入)</span>}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 标题 */}
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-slate-700">标题</label>
        <input id="title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder={isDocReview ? "例如：租房合同看不懂" : taskType === "scam_check" ? "例如：收到中奖短信要我转账" : taskType === "refund_request" ? "例如：淘宝买了手机卖家不发货" : "简短描述你的问题"}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all" />
      </div>

      {/* 描述 */}
      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700">
          {isDocReview ? "文件内容 / 补充说明" : "详细描述"}
        </label>
        <div className="relative">
          <textarea id="description" rows={8} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder={isDocReview
              ? "上传文件后内容会自动填入这里。你也可以直接粘贴合同、账单、通知的原文...\n\n例如：\n- 合同条款原文\n- 账单明细\n- 通知的具体内容"
              : "把情况详细说一下，比如：收到什么短信、买了什么东西、遇到了什么问题..."}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pb-14 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all resize-none shadow-sm" />
          
          {/* Voice button */}
          <div className="absolute left-3 bottom-3 select-none">
            <button
              type="button"
              onClick={toggleListening}
              className={`border rounded-xl px-3 py-1.5 text-xs flex items-center gap-1 shadow-sm font-sans font-bold transition-all ${
                isListening 
                  ? "bg-rose-50 border-rose-400 text-rose-700 animate-pulse" 
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
              }`}
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
        </div>
        {fileContent && (
          <p className="mt-1 text-xs text-slate-400">文件内容已填入描述框，你可以继续编辑或补充</p>
        )}
      </div>

      <button type="submit" disabled={loading || !taskType} className="btn-primary w-full rounded-xl py-3.5 text-sm font-semibold shadow-lg shadow-brand-500/25 disabled:opacity-50">
        {loading ? "创建并分析中..." : "创建任务并让 AI 分析"}
      </button>

      {/* Progress */}
      {loading && analyzeProgress && (
        <div className="rounded-xl bg-brand-50 p-4 border border-brand-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <span className="text-sm font-medium text-brand-700">{analyzeProgress}</span>
          </div>
          <div className="h-1.5 rounded-full bg-brand-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500" style={{ width: `${Math.round(analyzeProgressPct * 100)}%` }} />
          </div>
        </div>
      )}
    </form>
  );
}

/**
 * 从 PDF ArrayBuffer 中提取可读文本
 * 简单方案：解码为字符串，提取括号内的文本流 (PDF text objects)
 */
function extractTextFromPDFBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // 尝试解码为 UTF-8 文本
  let raw = "";
  try {
    raw = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return "";
  }

  // 提取 PDF 文本对象：BT ... ET 块中的 Tj/TJ 操作
  const textParts: string[] = [];
  const btEtRegex = /BT\s([\s\S]*?)\sET/g;
  let match;
  while ((match = btEtRegex.exec(raw)) !== null) {
    const block = match[1];
    // Tj: (text) Tj
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      textParts.push(tjMatch[1]);
    }
    // TJ: [(text) num (text)] TJ
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
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/tasks" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">← 返回任务列表</Link>
      <div className="mt-4 mb-8">
        <h1 className="text-3xl font-bold text-slate-900">新建任务</h1>
        <p className="mt-1 text-sm text-slate-500">选择类型，描述你的问题，AI 立即帮你分析</p>
      </div>
      <Suspense fallback={<div className="text-sm text-slate-400">加载中...</div>}>
        <NewTaskForm />
      </Suspense>
    </div>
  );
}
