import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Layers, HelpCircle, Calculator, FileText, StopCircle } from "lucide-react";
import { revisionQueue, getSubject, sampleQuestions } from "../../lib/mockData";
import type { RevisionItem } from "../../lib/types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { minutesToLabel } from "../../lib/utils";
import { EmptyState } from "../../components/ui/EmptyState";

const modeConfig: Record<RevisionItem["mode"], { icon: typeof Layers; label: string }> = {
  flashcard: { icon: Layers, label: "Flashcards" },
  "mini-quiz": { icon: HelpCircle, label: "Mini-quiz" },
  "worked-problem": { icon: Calculator, label: "Worked problem" },
  recap: { icon: FileText, label: "Recap" },
};

export function RevisionQueuePage() {
  const navigate = useNavigate();
  const [queue] = useState(revisionQueue);
  const [index, setIndex] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [flipped, setFlipped] = useState(false);

  const totalMinutes = queue.reduce((s, q) => s + q.estimatedMinutes, 0);
  const allDone = queue.length > 0 && completed.size === queue.length;

  function finishItem(id: string) {
    setCompleted((c) => new Set(c).add(id));
    setFlipped(false);
    setIndex(null);
  }

  if (queue.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<CheckCircle2 className="size-6" aria-hidden="true" />}
          title="Nothing due for review right now"
          description="Come back later — Astra will queue topics here as they come up for review."
        />
      </Card>
    );
  }

  if (allDone) {
    return (
      <Card className="max-w-md mx-auto text-center space-y-4 py-8">
        <span className="mx-auto size-14 rounded-full bg-sage-surface flex items-center justify-center">
          <CheckCircle2 className="size-7 text-sage" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-ink">Nice work.</h2>
          <p className="text-[15px] text-ink-secondary mt-1">You've strengthened your memory of {queue.length} topics today.</p>
        </div>
        <p className="text-sm text-ink-secondary">That's a solid amount for today — stopping here is a good call.</p>
        <Button fullWidth onClick={() => navigate("/")}>
          Back to home
        </Button>
      </Card>
    );
  }

  if (index !== null) {
    const item = queue[index];
    return <ReviewItemScreen item={item} flipped={flipped} setFlipped={setFlipped} onDone={() => finishItem(item.id)} onExit={() => setIndex(null)} />;
  }

  return (
    <div className="pb-6 space-y-4 pt-2 max-w-lg">
      <div>
        <h2 className="text-xl font-bold text-ink">Review today</h2>
        <p className="text-[15px] text-ink-secondary mt-1">
          {queue.length - completed.size} items · about {minutesToLabel(totalMinutes)}
        </p>
      </div>

      <div className="space-y-2.5">
        {queue.map((item, i) => {
          const subject = getSubject(item.subjectId);
          const cfg = modeConfig[item.mode];
          const done = completed.has(item.id);
          return (
            <Card key={item.id} padded={false} interactive={!done} onClick={() => !done && setIndex(i)}>
              <div className="flex items-center gap-3 p-4">
                <span className="size-5 flex items-center justify-center font-bold text-xs text-ink-secondary">{i + 1}</span>
                <span className="size-9 rounded-lg bg-sage-surface text-sage flex items-center justify-center shrink-0">
                  {done ? <CheckCircle2 className="size-4.5" aria-hidden="true" /> : <cfg.icon className="size-4.5" aria-hidden="true" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-[15px] text-ink truncate ${done ? "line-through text-ink-secondary" : ""}`}>{item.topicName}</p>
                  <p className="text-xs text-ink-secondary truncate">
                    {subject?.name} · {item.reason} · {minutesToLabel(item.estimatedMinutes)}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <button
        onClick={() => navigate("/")}
        className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-ink-secondary hover:text-sage py-2"
      >
        <StopCircle className="size-4" aria-hidden="true" /> Stop for today
      </button>
    </div>
  );
}

function ReviewItemScreen({
  item,
  flipped,
  setFlipped,
  onDone,
  onExit,
}: {
  item: RevisionItem;
  flipped: boolean;
  setFlipped: (v: boolean) => void;
  onDone: () => void;
  onExit: () => void;
}) {
  const question = sampleQuestions.find((q) => q.topicId === item.topicId);

  return (
    <div className="pb-6 pt-2 max-w-lg space-y-4">
      <button onClick={onExit} className="text-sm font-semibold text-ink-secondary hover:text-sage">
        ← Back to queue
      </button>

      <Card>
        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-3">{modeConfig[item.mode].label} · {item.topicName}</p>

        {item.mode === "flashcard" && (
          <button onClick={() => setFlipped(!flipped)} className="w-full min-h-40 rounded-xl border border-border-strong bg-[#F8F7F2] flex items-center justify-center p-6 text-center">
            <p className="text-[17px] font-semibold text-ink">
              {flipped ? `To solve ${item.topicName.toLowerCase()}, isolate one variable, eliminate it using addition or subtraction, then substitute back.` : item.topicName}
            </p>
          </button>
        )}

        {item.mode === "mini-quiz" && question && (
          <div className="space-y-3">
            <p className="text-[16px] font-semibold text-ink">{question.prompt}</p>
            <p className="text-sm text-ink-secondary">{question.explanation}</p>
          </div>
        )}

        {item.mode === "worked-problem" && (
          <p className="text-[15px] text-ink leading-relaxed">
            {question?.workedExample ?? "Work through a similar problem step by step, checking each line before moving to the next."}
          </p>
        )}

        {item.mode === "recap" && (
          <p className="text-[15px] text-ink leading-relaxed">
            Quick recap: {item.topicName} builds on definitions and relationships you've already covered — the key is
            recognising which rule applies before you start calculating.
          </p>
        )}
      </Card>

      <Button size="lg" fullWidth onClick={onDone}>
        Got it — next
      </Button>
    </div>
  );
}
