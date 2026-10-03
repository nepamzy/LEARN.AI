import type { Language } from "../../../lib/types";
import { Button } from "../../../components/ui/Button";
import { cx } from "../../../lib/utils";

interface Props {
  language: Language | "later";
  onChange: (lang: Language | "later") => void;
  onNext: () => void;
}

const OPTIONS: { id: Language | "later"; label: string; detail: string }[] = [
  { id: "en", label: "English", detail: "Default for all content" },
  { id: "pcm", label: "Pidgin", detail: "For informal explanations, where it helps" },
  { id: "later", label: "Choose later", detail: "You can change this anytime in Settings" },
];

export function AccessibilityStep({ language, onChange, onNext }: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-ink">Language preference</h2>
        <p className="text-[15px] text-ink-secondary">Astra's core content is in English. This sets the tone for tutor explanations.</p>
      </div>

      <div role="radiogroup" aria-label="Language preference" className="space-y-2.5">
        {OPTIONS.map((opt) => {
          const selected = language === opt.id;
          return (
            <button
              key={opt.id}
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.id)}
              className={cx(
                "w-full text-left rounded-xl border px-4 py-3 transition-colors duration-150",
                selected ? "border-sage bg-sage-surface" : "border-border-strong bg-surface hover:border-sage/50"
              )}
            >
              <p className="font-semibold text-ink text-[15px]">{opt.label}</p>
              <p className="text-xs text-ink-secondary mt-0.5">{opt.detail}</p>
            </button>
          );
        })}
      </div>

      <Button size="lg" fullWidth onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}
