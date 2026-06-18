"use client";

import { useState, useCallback, createContext, useContext, type ReactNode } from "react";

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-bold text-slate-900">{options.title}</h3>
            <p className="mb-6 text-sm text-slate-600 leading-relaxed">{options.message}</p>
            <div className="flex gap-3">
              <button onClick={handleCancel} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                {options.cancelText || "取消"}
              </button>
              <button onClick={handleConfirm}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-lg ${
                  options.danger ? "bg-red-600 hover:bg-red-700 shadow-red-500/25" : "btn-primary shadow-brand-500/25"
                }`}>
                {options.confirmText || "确定"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
