import { useState } from "react";
import { sampleQuestions } from "../../../lib/mockData";
import { Button } from "../../../components/ui/Button";
import { cx } from "../../../lib/utils";

interface Props {
  onFinish: (correct: number, total: number) => void;
}

const QUIZ_QUESTIONS = sampleQuestions.slice(0, 3);

export function DiagnosticQuizStep({ onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);

  const question = QUIZ_QUESTIONS[index];
  const isLast = index === QUIZ_QUESTIONS.length - 1;

  function handleNext() {
    const gotRight = selected === question.correctOptionId;
    const newCorrect = correct + (gotRight ? 1 : 0);
    if (isLast) {
      onFinish(newCorrect, QUIZ_QUESTIONS.length);
    } else {
      setCorrect(newCorrect);
      setIndex((i) => i + 1);
      setSelected(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-secondary">
          Quick check · {index + 1} of {QUIZ_QUESTIONS.length}
        </p>
      </div>

      <p className="text-[17px] font-semibold text-ink leading-snug">{question.prompt}</p>

      <div role="radiogroup" aria-label="Answer options" className="space-y-2">
        {question.options?.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(opt.id)}
              className={cx(
                "w-full text-left rounded-xl border px-4 py-3 text-[15px] font-medium transition-colors duration-150",
                isSelected ? "border-sage bg-sage-surface text-ink" : "border-border-strong bg-surface text-ink hover:border-sage/50"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <Button size="lg" fullWidth onClick={handleNext} disabled={!selected}>
        {isLast ? "See my starting point" : "Next question"}
      </Button>
    </div>
  );
}
