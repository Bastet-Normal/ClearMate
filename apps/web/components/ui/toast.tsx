"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToastMessage } from "@/types";

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800 [&_.progress]:bg-emerald-500",
  error:   "bg-red-50 border-red-200 text-red-800 [&_.progress]:bg-red-500",
  warning: "bg-amber-50 border-amber-200 text-amber-800 [&_.progress]:bg-amber-500",
  info:    "bg-brand-50 border-brand-200 text-brand-800 [&_.progress]:bg-brand-500",
};

const DARK_STYLES = {
  success: "dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300",
  error:   "dark:bg-red-950/60 dark:border-red-800 dark:text-red-300",
  warning: "dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300",
  info:    "dark:bg-brand-950/60 dark:border-brand-800 dark:text-brand-300",
};

interface SingleToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function SingleToast({ toast, onDismiss }: SingleToastProps) {
  const [exiting, setExiting] = useState(false);
  const duration = toast.duration ?? 4000;
  const Icon = ICONS[toast.type];

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 280);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [dismiss, duration]);

  return (
    <div
      className={cn(
        "relative flex w-full max-w-sm overflow-hidden rounded-xl border shadow-lg",
        "animate-slide-in-right",
        exiting && "opacity-0 translate-x-8 transition-all duration-280",
        STYLES[toast.type],
        DARK_STYLES[toast.type]
      )}
      role="alert"
    >
      {/* Progress bar */}
      <div
        className="progress absolute bottom-0 left-0 h-0.5 rounded-full"
        style={{
          animation: `progress-bar ${duration}ms linear forwards`,
          ["--progress-width" as string]: "0%",
          width: "100%",
          transformOrigin: "left",
          animationFillMode: "forwards",
        }}
      >
        <style>{`@keyframes shrink-${toast.id} { from { width: 100%; } to { width: 0%; } }`}</style>
        <div
          className="h-full rounded-full progress"
          style={{ animation: `shrink-${toast.id} ${duration}ms linear forwards` }}
        />
      </div>

      <div className="flex w-full gap-3 p-4">
        {/* Icon */}
        <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">{toast.title}</p>
          {toast.message && (
            <p className="mt-1 text-xs opacity-80 leading-relaxed">{toast.message}</p>
          )}
        </div>

        {/* Close */}
        <button
          onClick={dismiss}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity -mr-1 -mt-1"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm"
      aria-live="polite"
      aria-label="通知"
    >
      {toasts.map(t => (
        <SingleToast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (title: string, message?: string, duration?: number) =>
      addToast({ type: "success", title, message, duration }),
    error: (title: string, message?: string, duration?: number) =>
      addToast({ type: "error", title, message, duration: duration ?? 6000 }),
    warning: (title: string, message?: string, duration?: number) =>
      addToast({ type: "warning", title, message, duration }),
    info: (title: string, message?: string, duration?: number) =>
      addToast({ type: "info", title, message, duration }),
  };

  // Backward-compatible showToast(message, type?) for existing code
  const showToast = useCallback((message: string, type?: "success" | "error" | "warning" | "info") => {
    addToast({ type: type || "success", title: message });
  }, [addToast]);

  return { toasts, toast, dismiss, showToast };
}

// Simple legacy toast for backward compat
export { SingleToast };
