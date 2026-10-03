import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { sampleQuestions, getSubject, getTopic } from "../../lib/mockData";
import { isLiveSubject } from "../../lib/supabase";
import { fetchLiveQuestions, submitLiveAttempt } from "../../lib/api/liveData";
import { PracticeTopBar } from "./components/PracticeTopBar";
import { QuestionCard } from "./components/QuestionCard";
import { FeedbackSheet } from "./components/FeedbackSheet";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { ListSkeleton } from "../../components/ui/Skeleton";
import { classifyMistake } from "./mistakeClassifier";
import { nowMs } from "../../lib/dates";
import { useAppState } from "../../state/useAppState";
import { useToast } from "../../components/ui/useToast";
import type { PracticeAttempt, Question } from "../../lib/types";

interface NavState {
  subjectId?: string;
  mode?: "learning" | "serious";
  timed?: boolean;
}

export function PracticeSessionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshPendingCount } = useAppState();
  const { show } = useToast();
  const navState = (location.state as NavState) ?? {};
  const mode = navState.mode ?? "learning";
  const timed = navState.timed ?? false;

  const [questions, setQuestions] = useState<Question[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (navState.subjectId && isLiveSubject(navState.subjectId)) {
        try {
          const live = await fetchLiveQuestions(navState.subjectId);
          if (!cancelled) setQuestions(live.length > 0 ? live : sampleQuestions);
          return;
        } catch {
          if (!cancelled) show("Couldn't load the latest question bank — using what's saved on this device.", "warning");
        }
      }
      const filtered = navState.subjectId ? sampleQuestions.filter((q) => q.subjectId === navState.subjectId) : [];
      if (!cancelled) setQuestions(filtered.length > 0 ? filtered : sampleQuestions);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navState.subjectId]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [exitOpen, setExitOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(20 * 60);
  const [submitting, setSubmitting] = useState(false);
  const questionStart = useRef(0);

  const question = questions?.[index];

  useEffect(() => {
    questionStart.current = nowMs();
  }, [index]);

  useEffect(() => {
    if (!timed) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timed]);

  function toggleFlag() {
    if (!question) return;
    setFlagged((f) => {
      const next = new Set(f);
      if (next.has(question.id)) {
        next.delete(question.id);
      } else {
        next.add(question.id);
      }
      return next;
    });
  }

  async function submitAnswer() {
    if (!selected || !question) return;
    setSubmitting(true);
    const timeSeconds = Math.round((nowMs() - questionStart.current) / 1000);
    const isCorrect = selected === question.correctOptionId;
    const isFlagged = flagged.has(question.id);

    let mistakeType = isCorrect ? undefined : classifyMistake(timeSeconds);

    if (isLiveSubject(question.subjectId)) {
      try {
        const result = await submitLiveAttempt({
          question,
          selectedOptionId: selected,
          isCorrect,
          timeSeconds,
          flagged: isFlagged,
          now: new Date(),
        });
        mistakeType = result.mistakeType;
        if (result.queued) {
          refreshPendingCount();
          show("Saved on this device — will sync once you're back online.", "info");
        }
      } catch {
        show("Couldn't save that answer. It's kept on this device and we'll retry.", "warning");
      }
    }

    setSubmitting(false);
    setAttempts((a) => [...a, { questionId: question.id, selectedOptionId: selected, isCorrect, mistakeType, timeSeconds, flagged: isFlagged }]);
    if (mode === "learning") {
      setShowFeedback(true);
    } else {
      goNext();
    }
  }

  function goNext() {
    setShowFeedback(false);
    setSelected(null);
    if (!questions) return;
    if (index + 1 >= questions.length) {
      navigate("/practice/results", { state: { attempts, questions } });
    } else {
      setIndex((i) => i + 1);
    }
  }

  const lastAttempt = attempts[attempts.length - 1];

  if (!questions || !question) {
    return (
      <div className="min-h-screen bg-bg px-4 sm:px-6 py-6 max-w-2xl mx-auto">
        <ListSkeleton rows={2} />
      </div>
    );
  }

  const subject = getSubject(question.subjectId);
  const topic = getTopic(question.topicId);

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto pb-6">
        <PracticeTopBar
          subjectName={subject?.name ?? ""}
          topicName={topic?.name}
          questionIndex={index}
          questionCount={questions.length}
          timed={timed}
          secondsLeft={timed ? secondsLeft : undefined}
          onExit={() => setExitOpen(true)}
        />

        <div className="pt-3 px-4 sm:px-6">
          <QuestionCard
            question={question}
            selectedOptionId={selected}
            onSelect={setSelected}
            flagged={flagged.has(question.id)}
            onToggleFlag={toggleFlag}
            locked={mode === "learning" && showFeedback}
          />

          <Button
            size="lg"
            fullWidth
            className="mt-4"
            onClick={submitAnswer}
            loading={submitting}
            disabled={!selected || submitting || (mode === "learning" && showFeedback)}
          >
            {index + 1 === questions.length ? "Submit & finish" : "Submit answer"}
          </Button>
        </div>
      </div>

      {mode === "learning" && showFeedback && lastAttempt && (
        <FeedbackSheet
          open={showFeedback}
          question={question}
          selectedOptionId={lastAttempt.selectedOptionId ?? ""}
          isCorrect={lastAttempt.isCorrect}
          mistakeType={lastAttempt.mistakeType}
          onNext={goNext}
          onSaveForLater={goNext}
        />
      )}

      <Modal
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        title="Leave this session?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setExitOpen(false)}>
              Keep practicing
            </Button>
            <Button variant="destructive" onClick={() => navigate("/practice")}>
              Exit anyway
            </Button>
          </>
        }
      >
        Your progress so far is saved. You can pick this session back up from where you left off anytime.
      </Modal>
    </div>
  );
}
