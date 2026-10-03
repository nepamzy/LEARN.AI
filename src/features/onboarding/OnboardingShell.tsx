import type { ReactNode } from "react";
import { ChevronLeft, Compass } from "lucide-react";

interface OnboardingShellProps {
  stepIndex: number;
  stepCount: number;
  onBack?: () => void;
  onSaveLater?: () => void;
  children: ReactNode;
}

export function OnboardingShell({ stepIndex, stepCount, onBack, onSaveLater, children }: OnboardingShellProps) {
  const pct = Math.round(((stepIndex + 1) / stepCount) * 100);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="px-4 sm:px-6 py-4 flex items-center gap-3">
        {onBack ? (
          <button
            onClick={onBack}
            aria-label="Go back to previous step"
            className="size-9 flex items-center justify-center rounded-full text-ink-secondary hover:bg-sage-surface hover:text-sage transition-colors"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
        ) : (
          <span className="size-9 flex items-center justify-center rounded-xl bg-sage">
            <Compass className="size-5 text-white" aria-hidden="true" />
          </span>
        )}
        <div className="flex-1">
          <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Setup progress: step ${stepIndex + 1} of ${stepCount}`}
            className="h-1.5 w-full rounded-pill bg-[#EDEBE3] overflow-hidden"
          >
            <div className="h-full bg-sage rounded-pill transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {onSaveLater && (
          <button onClick={onSaveLater} className="text-sm font-semibold text-ink-secondary hover:text-sage whitespace-nowrap">
            Save &amp; finish later
          </button>
        )}
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 sm:px-6 pb-10">
        <div className="w-full max-w-md animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
