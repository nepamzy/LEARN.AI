import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Flag, X, Clock } from "lucide-react";
import { sampleQuestions, getSubject } from "../../lib/mockData";
import { isLiveSubject } from "../../lib/supabase";
import { fetchLiveQuestions, submitLiveAttempt } from "../../lib/api/liveData";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { StatusTag } from "../../components/ui/StatusTag";
import { ListSkeleton } from "../../components/ui/Skeleton";
import { useAppState } from "../../state/useAppState";
import { nowMs } from "../../lib/dates";
import { cx } from "../../lib/utils";
import type { Question } from "../../lib/types";

interface NavState {
  exam?: string;
  subjects?: string[];
  duration?: string;
}

function formatClock(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function ExamSimulatorSessionPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { refreshPendingCount } = useAppState();
  const navState = (state as NavState) ?? {};

  const [questions, setQuestions] = useState<Question[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const subjectIds = navState.subjects ?? [];
      const batches = await Promise.all(
        subjectIds.map(async (subjectId) => {
          if (isLiveSubject(subjectId)) {
            try {
              return await fetchLiveQuestions(subjectId);
            } catch {
              return sampleQuestions.filter((q) => q.subjectId === subjectId);
            }
          }
          return sampleQuestions.filter((q) => q.subjectId === subjectId);
        })
      );
      const combined = batches.flat();
      if (!cancelled) setQuestions(combined.length > 0 ? combined : sampleQuestions);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navState.subjects?.join(",")]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const totalSeconds = (Number(navState.duration) || 40) * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const timeSpentRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  // Accumulate time spent per question across revisits: each time `index`
  // changes (or the exam is left), the cleanup credits the elapsed time to
  // whichever question was on screen.
  useEffect(() => {
    if (!questions) return;
    const startedAt = nowMs();
    const qId = questions[index]?.id;
    const timeSpent = timeSpentRef.current; // stable object identity across renders
    return () => {
      if (!qId) return;
      const elapsed = (nowMs() - startedAt) / 1000;
      timeSpent[qId] = (timeSpent[qId] ?? 0) + elapsed;
    };
  }, [index, questions]);

  const question = questions?.[index];
  const answeredCount = Object.keys(answers).length;

  function toggleFlag(id: string) {
    setFlagged((f) => {
      const next = new Set(f);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function submit() {
    if (!questions) return;
    setSubmitting(true);

    const liveAnswered = questions.filter((q) => answers[q.id] && isLiveSubject(q.subjectId));
    let anyQueued = false;
    await Promise.all(
      liveAnswered.map(async (q) => {
        const selectedOptionId = answers[q.id];
        const isCorrect = selectedOptionId === q.correctOptionId;
        const timeSeconds = Math.max(1, Math.round(timeSpentRef.current[q.id] ?? 0));
        try {
          const result = await submitLiveAttempt({
            question: q,
            selectedOptionId,
            isCorrect,
            timeSeconds,
            flagged: flagged.has(q.id),
            now: new Date(),
          });
          if (result.queued) anyQueued = true;
        } catch {
          anyQueued = true;
        }
      })
    );
    if (anyQueued) refreshPendingCount();

    setSubmitting(false);
    navigate("/exam/results", { state: { answers, questions } });
  }

  if (!questions || !question) {
    return (
      <div className="min-h-screen bg-ink px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <ListSkeleton rows={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-white px-4 sm:px-6 lg:px-8 py-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setExitOpen(true)}
          aria-label="Exit exam"
          className="size-9 flex items-center justify-center rounded-full text-white/70 hover:bg-white/10 transition-colors"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        <p className="text-sm font-semibold text-white/80">{navState.exam} mock exam</p>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-amber">
          <Clock className="size-4" aria-hidden="true" /> {formatClock(secondsLeft)}
        </span>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">
          {getSubject(question.subjectId)?.name} · Question {index + 1} of {questions.length}
        </p>

        <div className="bg-[#1F2A35] rounded-card-lg p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[18px] font-semibold leading-snug">{question.prompt}</p>
            <button
              onClick={() => toggleFlag(question.id)}
              aria-pressed={flagged.has(question.id)}
              aria-label="Flag for review"
              className={cx(
                "shrink-0 size-9 rounded-full flex items-center justify-center transition-colors",
                flagged.has(question.id) ? "bg-amber/20 text-amber" : "text-white/60 hover:bg-white/10"
              )}
            >
              <Flag className="size-4.5" aria-hidden="true" />
            </button>
          </div>

          <div role="radiogroup" aria-label="Answer options" className="space-y-2">
            {question.options?.map((opt) => {
              const isSelected = answers[question.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setAnswers((a) => ({ ...a, [question.id]: opt.id }))}
                  className={cx(
                    "w-full text-left rounded-xl border px-4 py-3.5 text-[15px] font-medium transition-colors duration-150",
                    isSelected ? "border-amber bg-amber/10 text-white" : "border-white/15 text-white/90 hover:border-white/30"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 gap-2">
          <Button variant="secondary" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="!bg-white/10 !text-white !border-white/20">
            Previous
          </Button>
          {index + 1 < questions.length ? (
            <Button onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}>Next</Button>
          ) : (
            <Button onClick={() => setReviewOpen(true)}>Review &amp; submit</Button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-5" role="group" aria-label="Jump to question">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setIndex(i)}
              aria-current={i === index}
              aria-label={`Question ${i + 1}${answers[q.id] ? ", answered" : ", unanswered"}${flagged.has(q.id) ? ", flagged" : ""}`}
              className={cx(
                "size-8 rounded-lg text-xs font-semibold flex items-center justify-center border transition-colors",
                i === index && "ring-2 ring-amber",
                answers[q.id] ? "bg-white/15 border-white/20 text-white" : "bg-transparent border-white/15 text-white/60",
                flagged.has(q.id) && "border-amber text-amber"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Review before you submit" size="lg">
        <p className="text-ink-secondary mb-3">
          {answeredCount} of {questions.length} answered{flagged.size > 0 ? ` · ${flagged.size} flagged for review` : ""}.
        </p>
        <ul className="space-y-1.5 max-h-64 overflow-y-auto">
          {questions.map((q, i) => (
            <li key={q.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
              <button onClick={() => { setReviewOpen(false); setIndex(i); }} className="text-sm font-medium text-ink hover:text-sage text-left">
                Question {i + 1}
              </button>
              <StatusTag tone={answers[q.id] ? "sage" : "amber"}>{answers[q.id] ? "Answered" : "Unanswered"}</StatusTag>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" fullWidth onClick={() => setReviewOpen(false)}>
            Keep reviewing
          </Button>
          <Button fullWidth onClick={() => { setReviewOpen(false); setConfirmOpen(true); }}>
            Submit exam
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Submit this exam?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={submit} loading={submitting}>
              Yes, submit
            </Button>
          </>
        }
      >
        Once submitted, you won't be able to change your answers. {questions.length - answeredCount > 0 && `You have ${questions.length - answeredCount} unanswered questions.`}
      </Modal>

      <Modal
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        title="Exit this exam?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setExitOpen(false)}>
              Keep going
            </Button>
            <Button variant="destructive" onClick={() => navigate("/exam")}>
              Exit anyway
            </Button>
          </>
        }
      >
        Your answers so far will be saved as a draft. Leaving a mock exam early means it won't count toward your estimated score.
      </Modal>
    </div>
  );
}
