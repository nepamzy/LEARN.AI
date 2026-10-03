import type { ExamType } from "../../../lib/types";
import { Button } from "../../../components/ui/Button";
import { cx } from "../../../lib/utils";

const EXAMS: { id: ExamType; blurb: string }[] = [
  { id: "JAMB", blurb: "UTME — university entry" },
  { id: "WAEC", blurb: "West African exams council" },
  { id: "NECO", blurb: "National exams council" },
  { id: "Post-UTME", blurb: "University screening" },
  { id: "BECE", blurb: "Junior secondary exit" },
  { id: "Common Entrance", blurb: "Secondary school entry" },
];

interface Props {
  value: ExamType | null;
  onChange: (exam: ExamType) => void;
  onNext: () => void;
  error?: string;
}

export function ExamStep({ value, onChange, onNext, error }: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-ink">Which exam are you preparing for?</h2>
        <p className="text-[15px] text-ink-secondary">This shapes your subjects and practice style.</p>
      </div>

      <div role="radiogroup" aria-label="Choose your exam" className="grid grid-cols-2 gap-2.5">
        {EXAMS.map((exam) => {
          const selected = value === exam.id;
          return (
            <button
              key={exam.id}
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(exam.id)}
              className={cx(
                "text-left rounded-xl border px-3.5 py-3 transition-colors duration-150",
                selected ? "border-sage bg-sage-surface" : "border-border-strong bg-surface hover:border-sage/50"
              )}
            >
              <p className="font-semibold text-ink text-[15px]">{exam.id}</p>
              <p className="text-xs text-ink-secondary mt-0.5">{exam.blurb}</p>
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
