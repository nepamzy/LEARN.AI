import type { EducationLevel } from "../../../lib/types";
import { EDUCATION_LEVEL_LABELS } from "../../../lib/educationLevel";
import { Button } from "../../../components/ui/Button";
import { cx } from "../../../lib/utils";

const LEVELS: { id: EducationLevel; blurb: string }[] = [
  { id: "primary", blurb: "Preparing for Common Entrance" },
  { id: "junior-secondary", blurb: "Preparing for BECE" },
  { id: "senior-secondary", blurb: "Preparing for WAEC, NECO, JAMB or Post-UTME" },
  { id: "university", blurb: "University or tertiary study" },
];

interface Props {
  value: EducationLevel | null;
  onChange: (level: EducationLevel) => void;
  onNext: () => void;
  error?: string;
}

export function EducationLevelStep({ value, onChange, onNext, error }: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-ink">What level are you studying at?</h2>
        <p className="text-[15px] text-ink-secondary">This decides which exams and subjects we show you next.</p>
      </div>

      <div role="radiogroup" aria-label="Choose your education level" className="space-y-2.5">
        {LEVELS.map((level) => {
          const selected = value === level.id;
          return (
            <button
              key={level.id}
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(level.id)}
              className={cx(
                "w-full text-left rounded-xl border px-4 py-3 transition-colors duration-150",
                selected ? "border-sage bg-sage-surface" : "border-border-strong bg-surface hover:border-sage/50"
              )}
            >
              <p className="font-semibold text-ink text-[15px]">{EDUCATION_LEVEL_LABELS[level.id]}</p>
              <p className="text-xs text-ink-secondary mt-0.5">{level.blurb}</p>
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-error font-medium" role="alert">{error}</p>}

      <Button size="lg" fullWidth onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}
