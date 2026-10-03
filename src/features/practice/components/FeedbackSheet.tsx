import { useState } from "react";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import type { Question, MistakeType } from "../../../lib/types";
import { Drawer } from "../../../components/ui/Drawer";
import { Button } from "../../../components/ui/Button";
import { StatusTag } from "../../../components/ui/StatusTag";
import { mistakeLabel, mistakeAdvice } from "../mistakeClassifier";

interface Props {
  open: boolean;
  question: Question;
  selectedOptionId: string;
  isCorrect: boolean;
  mistakeType?: MistakeType;
  onNext: () => void;
  onSaveForLater: () => void;
}

export function FeedbackSheet({ open, question, selectedOptionId, isCorrect, mistakeType, onNext, onSaveForLater }: Props) {
  const [showWorked, setShowWorked] = useState(false);
  const [explainDifferently, setExplainDifferently] = useState(false);

  return (
    <Drawer
      open={open}
      onClose={() => {}}
      hideCloseButton
      title={isCorrect ? "Correct" : "Not yet correct"}
      footer={
        <div className="flex flex-col gap-2">
          <Button fullWidth size="lg" onClick={onNext}>
            Next question
          </Button>
          {!isCorrect && (
            <Button fullWidth size="md" variant="ghost" onClick={onSaveForLater}>
              Practice this again later
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          {isCorrect ? (
            <CheckCircle2 className="size-6 text-success shrink-0" aria-hidden="true" />
          ) : (
            <Circle className="size-6 text-amber shrink-0" aria-hidden="true" />
          )}
          <p className="font-semibold text-ink text-[16px]">
            {isCorrect ? "Nicely done." : "This question reveals a useful gap to work on."}
          </p>
        </div>

        {!isCorrect && mistakeType && (
          <div>
            <StatusTag tone={mistakeType === "concept" ? "info" : mistakeType === "careless" ? "amber" : "sage"}>
              {mistakeLabel[mistakeType]}
            </StatusTag>
            <p className="text-sm text-ink-secondary mt-2">{mistakeAdvice[mistakeType]}</p>
          </div>
        )}

        <div className="rounded-xl bg-[#F8F7F2] border border-border p-4">
          <p className="text-sm font-semibold text-ink-secondary mb-1.5">Explanation</p>
          <p className="text-[15px] text-ink leading-relaxed">
            {explainDifferently
              ? "Think of it like balancing a scale: whatever you do to one side (add, subtract, multiply), do exactly the same to the other, until only one unknown is left standing."
              : question.explanation}
          </p>
        </div>

        {!isCorrect && question.whyWrongByOption?.[selectedOptionId] && (
          <div>
            <p className="text-sm font-semibold text-ink-secondary mb-1">Why your answer wasn't it</p>
            <p className="text-[15px] text-ink leading-relaxed">{question.whyWrongByOption[selectedOptionId]}</p>
          </div>
        )}

        {showWorked && question.workedExample && (
          <div className="rounded-xl bg-sage-surface p-4">
            <p className="text-sm font-semibold text-sage-hover mb-1">Worked example</p>
            <p className="text-[15px] text-ink leading-relaxed">{question.workedExample}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setExplainDifferently((v) => !v)}>
            <Sparkles className="size-3.5" aria-hidden="true" /> Explain differently
          </Button>
          {question.workedExample && (
            <Button size="sm" variant="secondary" onClick={() => setShowWorked((v) => !v)}>
              Show a worked example
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  );
}
