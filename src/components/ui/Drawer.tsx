import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  hideCloseButton?: boolean;
}

// Bottom sheet on mobile, right-side panel on larger screens.
export function Drawer({ open, onClose, title, children, footer, hideCloseButton }: DrawerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
      <div className="absolute inset-0 bg-ink/40 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        tabIndex={-1}
        className="relative w-full sm:w-[420px] sm:max-w-[90vw] bg-surface rounded-t-card-lg sm:rounded-none sm:rounded-l-card-lg shadow-raised border border-border max-h-[85vh] sm:max-h-none sm:h-full flex flex-col animate-slide-up outline-none"
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-border">
          <h2 id="drawer-title" className="text-lg font-bold text-ink">
            {title}
          </h2>
          {!hideCloseButton && (
            <button
              onClick={onClose}
              aria-label="Close panel"
              className="shrink-0 size-8 flex items-center justify-center rounded-full text-ink-secondary hover:bg-sage-surface hover:text-sage transition-colors"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-5 text-[15px] text-ink leading-relaxed">{children}</div>
        {footer && <div className="p-5 border-t border-border">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
