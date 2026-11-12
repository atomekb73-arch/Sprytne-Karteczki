"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<Map<number, number>>(new Map());
  const nextIdRef = useRef(1);

  const dismissToast = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = "info", durationMs = 4500) => {
      const id = nextIdRef.current++;
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);

      const timer = window.setTimeout(() => {
        dismissToast(id);
      }, durationMs);
      timersRef.current.set(id, timer);
    },
    [dismissToast]
  );

  useEffect(() => {
    const el = popoverRef.current;
    if (!el) return;

    if (toasts.length > 0) {
      try {
        if (!el.matches(":popover-open")) {
          el.showPopover?.();
        }
      } catch {
        // Fallback gdy Popover API nie jest obslugiwane
      }
    } else {
      try {
        if (el.matches(":popover-open")) {
          el.hidePopover?.();
        }
      } catch {
        // Fallback
      }
    }
  }, [toasts.length]);

  useEffect(() => {
    const activeTimers = timersRef.current;
    return () => {
      for (const timer of activeTimers.values()) {
        window.clearTimeout(timer);
      }
      activeTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        ref={popoverRef}
        popover="manual"
        role="region"
        aria-label="Powiadomienia aplikacji"
        className="no-print toast-popover pointer-events-none fixed inset-auto right-4 bottom-4 z-50 m-0 flex w-full max-w-sm flex-col gap-2 border-0 bg-transparent p-0"
      >
        <div role="status" aria-live="polite" aria-atomic="true" className="flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm shadow-lg backdrop-blur-md ${
                toast.tone === "success"
                  ? "border-emerald-300 bg-emerald-50/95 text-emerald-950"
                  : toast.tone === "error"
                    ? "border-rose-300 bg-rose-50/95 text-rose-950"
                    : "border-stone-300 bg-white/95 text-stone-900"
              }`}
            >
              {toast.tone === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
              ) : toast.tone === "error" ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" aria-hidden="true" />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-stone-700" aria-hidden="true" />
              )}
              <p className="flex-1 leading-snug font-medium">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Zamknij powiadomienie"
                className="rounded-md p-0.5 text-stone-500 transition hover:bg-black/5 hover:text-stone-900"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
