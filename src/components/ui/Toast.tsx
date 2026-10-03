import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";
import { cx } from "../../lib/utils";

type ToastTone = "success" | "info" | "warning" | "error";

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneConfig: Record<ToastTone, { icon: ReactNode; classes: string }> = {
  success: { icon: <CheckCircle2 className="size-5" aria-hidden="true" />, classes: "bg-success-surface text-success border-success/20" },
  info: { icon: <Info className="size-5" aria-hidden="true" />, classes: "bg-info-surface text-info border-info/20" },
  warning: { icon: <AlertTriangle className="size-5" aria-hidden="true" />, classes: "bg-amber-surface text-amber border-amber/20" },
  error: { icon: <AlertTriangle className="size-5" aria-hidden="true" />, classes: "bg-error-surface text-error border-error/20" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, message, tone }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div
          className="fixed bottom-20 sm:bottom-6 inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none"
          role="region"
          aria-live="polite"
        >
          {toasts.map((t) => {
            const cfg = toneConfig[t.tone];
            return (
              <div
                key={t.id}
                className={cx(
                  "pointer-events-auto flex items-center gap-2 w-full max-w-sm rounded-xl border px-4 py-3 shadow-raised bg-surface animate-slide-up",
                  cfg.classes
                )}
              >
                {cfg.icon}
                <p className="text-sm font-medium flex-1">{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="shrink-0 opacity-70 hover:opacity-100"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
