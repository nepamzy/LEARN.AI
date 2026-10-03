import type { TutorTone } from "../tutorEngine";
import { cx } from "../../../lib/utils";

const TONES: { id: TutorTone; label: string }[] = [
  { id: "concise", label: "Concise" },
  { id: "guided", label: "Guided" },
  { id: "visual", label: "Visual analogy" },
  { id: "step-by-step", label: "Step-by-step" },
];

export function ToneSelector({ value, onChange }: { value: TutorTone; onChange: (t: TutorTone) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" role="radiogroup" aria-label="Explanation style">
      {TONES.map((t) => (
        <button
          key={t.id}
          role="radio"
          aria-checked={value === t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            "shrink-0 rounded-pill px-3 py-1.5 text-xs font-semibold border transition-colors",
            value === t.id ? "bg-sage text-white border-sage" : "bg-surface text-ink-secondary border-border-strong hover:border-sage/50"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
