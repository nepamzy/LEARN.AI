import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flag, Lightbulb, Volume2, Sparkles } from "lucide-react";
import type { Question } from "../../../lib/types";
import { Card } from "../../../components/ui/Card";
import { cx } from "../../../lib/utils";

interface Props {
  question: Question;
  selectedOptionId: string | null;
  onSelect: (id: string) => void;
  flagged: boolean;
  onToggleFlag: () => void;
  locked: boolean;
}

export function QuestionCard({ question, selectedOptionId, onSelect, flagged, onToggleFlag, locked }: Props) {
  const navigate = useNavigate();
  const [hintOpen, setHintOpen] = useState(false);

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[18px] font-semibold text-ink leading-snug">{question.prompt}</p>
        <button
          onClick={onToggleFlag}
          aria-pressed={flagged}
          aria-label={flagged ? "Remove flag for review" : "Flag this question for review"}
          className={cx(
            "shrink-0 size-9 rounded-full flex items-center justify-center transition-colors",
            flagged ? "bg-amber-surface text-amber" : "text-ink-secondary hover:bg-sage-surface hover:text-sage"
          )}
        >
          <Flag className="size-4.5" aria-hidden="true" />
        </button>
      </div>

      <div role="radiogroup" aria-label="Answer options" className="space-y-2">
        {question.options?.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          return (
            <button
              key={opt.id}
              role="radio"
              aria-checked={isSelected}
              disabled={locked}
              onClick={() => onSelect(opt.id)}
              className={cx(
                "w-full text-left rounded-xl border px-4 py-3.5 text-[15px] font-medium transition-colors duration-150 min-h-11",
                isSelected ? "border-sage bg-sage-surface text-ink" : "border-border-strong bg-surface text-ink hover:border-sage/50",
                locked && "opacity-70 cursor-not-allowed"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-border -mx-4 sm:-mx-5 px-4 sm:px-5 pt-3">
        <button
          onClick={() => setHintOpen((h) => !h)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-secondary hover:text-sage px-2.5 py-1.5 rounded-lg"
        >
          <Lightbulb className="size-4" aria-hidden="true" /> Need a hint
        </button>
        <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-secondary hover:text-sage px-2.5 py-1.5 rounded-lg">
          <Volume2 className="size-4" aria-hidden="true" /> Read aloud
        </button>
        <button
          onClick={() => navigate("/tutor")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-secondary hover:text-sage px-2.5 py-1.5 rounded-lg"
        >
          <Sparkles className="size-4" aria-hidden="true" /> Ask Tutor
        </button>
      </div>

      {hintOpen && (
        <p className="text-sm text-ink-secondary bg-info-surface rounded-xl px-3.5 py-3 -mt-1">
          Try isolating one variable first — what happens if you add or subtract the two equations directly?
        </p>
      )}
    </Card>
  );
}
