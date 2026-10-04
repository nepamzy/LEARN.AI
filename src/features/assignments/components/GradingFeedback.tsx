import { AlertTriangle, Clock, Loader2, RotateCcw, Sparkles } from "lucide-react";
import type { GradingResult, RubricCriterion } from "../../../lib/ai/types";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Banner } from "../../../components/ui/Banner";

export type GradingState =
  | { status: "pending"; reason: "not-configured" | "file" | "waiting" }
  | { status: "graded"; result: GradingResult }
  | { status: "failed"; reason?: "rate-limited" }
  | { status: "save-failed" }
  | { status: "resuming" }
  | { status: "unfinished" };

interface Props {
  state: GradingState;
  rubric: RubricCriterion[];
  onRetry: () => void;
  retrying: boolean;
}

const pendingCopy: Record<"not-configured" | "file" | "waiting", string> = {
  "not-configured": "AI feedback isn't switched on for this build yet. Your work is saved on this device and will be marked once it is.",
  file: "Astra can't read uploaded files yet, so this submission won't get AI feedback. Typing or photographing your answer will.",
  waiting: "Your work is saved on this device. Astra will mark it when the connection is back.",
};

export function GradingFeedback({ state, rubric, onRetry, retrying }: Props) {
  if (state.status === "pending") {
    return (
      <Banner tone="neutral" icon={<Clock className="size-4 shrink-0" aria-hidden="true" />}>
        {pendingCopy[state.reason]}
      </Banner>
    );
  }

  if (state.status === "resuming") {
    return (
      <Banner tone="neutral" icon={<Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />}>
        Finishing your submission. Saving your feedback…
      </Banner>
    );
  }

  if (state.status === "unfinished") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-info/15 bg-info-surface text-info px-4 py-3 text-[14px] font-medium">
        <Clock className="size-4 shrink-0" aria-hidden="true" />
        <span className="flex-1">You have an unfinished submission for this assignment. Astra hasn't marked it yet.</span>
        <Button size="sm" variant="secondary" onClick={onRetry} loading={retrying}>
          Resume marking
        </Button>
      </div>
    );
  }

  if (state.status === "save-failed") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-amber/15 bg-amber-surface text-amber px-4 py-3 text-[14px] font-medium">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        <span className="flex-1">Astra marked this, but we couldn't save the feedback yet. Try again to save it.</span>
        <Button size="sm" variant="secondary" onClick={onRetry} loading={retrying}>
          <RotateCcw className="size-3.5" aria-hidden="true" /> Try again
        </Button>
      </div>
    );
  }

  if (state.status === "failed") {
    const isRateLimited = state.reason === "rate-limited";
    return (
      <div className="flex items-center gap-3 rounded-xl border border-amber/15 bg-amber-surface text-amber px-4 py-3 text-[14px] font-medium">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        <span className="flex-1">
          {isRateLimited
            ? "You've reached today's AI grading limit. Your work is saved — try again tomorrow."
            : "Astra couldn't mark this just now. Your work is saved on this device."}
        </span>
        <Button size="sm" variant="secondary" onClick={onRetry} loading={retrying}>
          <RotateCcw className="size-3.5" aria-hidden="true" /> Try again
        </Button>
      </div>
    );
  }

  const { result } = state;
  const nameFor = (id: string) => rubric.find((r) => r.id === id)?.name ?? id;

  return (
    <Card className="space-y-4">
      <div>
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage-hover">
          <Sparkles className="size-4" aria-hidden="true" /> AI practice feedback
        </p>
        <p className="text-sm text-ink-secondary mt-1">
          Rubric-based guidance, not an official grade. Your teacher's grade is separate.
        </p>
      </div>

      <p className="text-2xl font-bold text-ink">
        {result.totalScore} <span className="text-base font-medium text-ink-secondary">/ {result.maxScore}</span>
      </p>

      <ul className="space-y-3">
        {result.criteria.map((c) => (
          <li key={c.criterionId} className="border-t border-border pt-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-ink text-[15px]">{nameFor(c.criterionId)}</span>
              <span className="text-sm font-semibold text-ink">
                {c.score} / {rubric.find((r) => r.id === c.criterionId)?.maxScore}
              </span>
            </div>
            <p className="text-[15px] text-ink-secondary mt-1">{c.feedback}</p>
            {c.quotes.map((q) => (
              <blockquote key={q} className="mt-2 border-l-2 border-sage/40 pl-3 text-sm italic text-ink-secondary">
                "{q}"
              </blockquote>
            ))}
          </li>
        ))}
      </ul>

      {result.strengths.length > 0 && (
        <div>
          <h4 className="font-semibold text-ink text-[15px] mb-1">Strengths</h4>
          <ul className="list-disc pl-5 space-y-1 text-[15px] text-ink-secondary">
            {result.strengths.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>
      )}
      {result.improvements.length > 0 && (
        <div>
          <h4 className="font-semibold text-ink text-[15px] mb-1">To improve</h4>
          <ul className="list-disc pl-5 space-y-1 text-[15px] text-ink-secondary">
            {result.improvements.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>
      )}
    </Card>
  );
}
