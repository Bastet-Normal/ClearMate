"use client";

import { useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue>({ confirm: () => Promise.resolve(false) });

export function useConfirm() {
  return useContext(ConfirmContext).confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setResolver(() => resolve);
    });
  }, []);

  function handleConfirm() {
    setOptions(null);
    resolver?.(true);
  }

  function handleCancel() {
    setOptions(null);
    resolver?.(false);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-scale-in" style={{ background: "rgb(var(--bg-0))" }}>
            <h3 className="mb-2 text-lg font-bold text-fg-primary">{options.title}</h3>
            <p className="mb-6 text-sm text-fg-muted leading-relaxed">{options.message}</p>
            <div className="flex gap-3">
              <button onClick={handleCancel} className="flex-1 btn btn-md btn-secondary">
                {options.cancelText || "取消"}
              </button>
              <button onClick={handleConfirm} className={cn("flex-1 btn btn-md", options.danger ? "btn-danger" : "btn-primary")}>
                {options.confirmText || "确定"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
