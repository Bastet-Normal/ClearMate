"use client";

import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
  description?: string;
}

const DEFAULT_STEPS: Step[] = [
  { id: "read",    label: "读取内容",     description: "正在认真阅读您提供的信息..." },
  { id: "extract", label: "提取关键要素",  description: "识别金额、日期、相关方..." },
  { id: "match",   label: "风险规则比对",  description: "与消费保护法规及诈骗数据库比对..." },
  { id: "action",  label: "生成行动指引",  description: "规划最有效的解决方案..." },
  { id: "draft",   label: "起草维权模板",  description: "撰写专业申诉公文模板..." },
];

interface ThinkingStepsProps {
  steps?: Step[];
  currentStep: string;   // step id or label substring
  progress: number;      // 0–100
  isElder?: boolean;
  className?: string;
}

export function ThinkingSteps({ steps = DEFAULT_STEPS, currentStep, progress, isElder, className }: ThinkingStepsProps) {
  const currentIndex = steps.findIndex(s =>
    s.id === currentStep || s.label.includes(currentStep) || currentStep.includes(s.label)
  );
  const activeIndex = currentIndex >= 0 ? currentIndex : Math.floor((progress / 100) * steps.length);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Overall progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-fg-muted">
          <span className="font-medium">AI 分析进度</span>
          <span className="font-bold tabular-nums text-brand-600 dark:text-brand-300">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-700 ease-spring"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps timeline */}
      <div className="relative space-y-0">
        {steps.map((step, i) => {
          const isDone    = i < activeIndex;
          const isActive  = i === activeIndex;
          const isPending = i > activeIndex;

          return (
            <div key={step.id} className="flex gap-3">
              {/* Left: dot + connector line */}
              <div className="flex flex-col items-center">
                {/* Dot */}
                <div className={cn(
                  "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-500",
                  isElder ? "h-9 w-9" : "",
                  isDone    && "bg-emerald-500 shadow-md shadow-emerald-500/30",
                  isActive  && "bg-brand-500 shadow-lg shadow-brand-500/40 ring-4 ring-brand-500/15",
                  isPending && "bg-surface-2 border-2 border-border"
                )}>
                  {isDone ? (
                    <CheckCircle2 className={cn("text-white", isElder ? "h-5 w-5" : "h-3.5 w-3.5")} />
                  ) : isActive ? (
                    <Loader2 className={cn("text-white animate-spin", isElder ? "h-5 w-5" : "h-3.5 w-3.5")} />
                  ) : (
                    <Clock className={cn("text-fg-faint", isElder ? "h-5 w-5" : "h-3.5 w-3.5")} />
                  )}

                  {/* Pulse ring for active */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-brand-400 animate-ping opacity-30" />
                  )}
                </div>

                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className={cn(
                    "mt-0.5 w-0.5 flex-1 min-h-[20px] rounded-full transition-all duration-700",
                    isDone ? "bg-emerald-300" : "bg-border"
                  )} style={{ minHeight: 18 }} />
                )}
              </div>

              {/* Right: text */}
              <div className={cn("pb-4 pt-0.5 min-w-0 flex-1", i === steps.length - 1 && "pb-0")}>
                <p className={cn(
                  "font-semibold leading-tight transition-colors duration-300",
                  isElder ? "text-base" : "text-sm",
                  isDone    && "text-emerald-600 dark:text-emerald-400",
                  isActive  && "text-brand-700 dark:text-brand-300",
                  isPending && "text-fg-faint"
                )}>
                  {step.label}
                </p>
                {(isActive || isDone) && step.description && (
                  <p className={cn(
                    "mt-0.5 text-fg-muted animate-fade-in",
                    isElder ? "text-sm" : "text-xs"
                  )}>
                    {isActive ? step.description : "✓ 完成"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
