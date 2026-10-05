import { useEffect } from "react";
import type { ExamType } from "../../../lib/types";
import { Button } from "../../../components/ui/Button";
import { cx } from "../../../lib/utils";

const EXAM_BLURBS: Record<ExamType, string> = {
  JAMB: "UTME — university entry",
  WAEC: "West African exams council",
  NECO: "National exams council",
  "Post-UTME": "University screening",
  BECE: "Junior secondary exit",
  "Common Entrance": "Secondary school entry",
};

interface Props {
  value: ExamType | null;
  /** Which exams are valid for the student's chosen education level (lib/educationLevel.ts). */
  allowedExams: ExamType[];
  onChange: (exam: ExamType) => void;
  onNext: () => void;
  error?: string;
}

export function ExamStep({ value, allowedExams, onChange, onNext, error }: Props) {
  // Primary and Junior Secondary each have exactly one valid exam — pick it
  // for the student rather than making them tap a single-option list.
  useEffect(() => {
    if (!value && allowedExams.length === 1) onChange(allowedExams[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedExams]);

  const exams = allowedExams.map((id) => ({ id, blurb: EXAM_BLURBS[id] }));

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-ink">Which exam are you preparing for?</h2>
        <p className="text-[15px] text-ink-secondary">This shapes your subjects and practice style.</p>
      </div>

      <div role="radiogroup" aria-label="Choose your exam" className="grid grid-cols-2 gap-2.5">
        {exams.map((exam) => {
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
