import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { sampleQuestions, getSubject, getTopic } from "../../lib/mockData";
import { PracticeTopBar } from "./components/PracticeTopBar";
import { QuestionCard } from "./components/QuestionCard";
import { FeedbackSheet } from "./components/FeedbackSheet";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { classifyMistake } from "./mistakeClassifier";
import { nowMs } from "../../lib/dates";
import type { PracticeAttempt } from "../../lib/types";

interface NavState {
  subjectId?: string;
  mode?: "learning" | "serious";
  timed?: boolean;
}

export function PracticeSessionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as NavState) ?? {};
  const mode = navState.mode ?? "learning";
  const timed = navState.timed ?? false;

  const questions = navState.subjectId
    ? sampleQuestions.filter((q) => q.subjectId === navState.subjectId).length > 0
      ? sampleQuestions.filter((q) => q.subjectId === navState.subjectId)
      : sampleQuestions
    : sampleQuestions;

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [exitOpen, setExitOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(20 * 60);
  const questionStart = useRef(0);

  const question = questions[index];

  useEffect(() => {
    questionStart.current = nowMs();
  }, [index]);

  useEffect(() => {
    if (!timed) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timed]);

  function toggleFlag() {
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

  function submitAnswer() {
    if (!selected) return;
    const timeSeconds = Math.round((nowMs() - questionStart.current) / 1000);
    const isCorrect = selected === question.correctOptionId;
    const mistakeType = isCorrect ? undefined : classifyMistake(timeSeconds);
    setAttempts((a) => [
      ...a,
      { questionId: question.id, selectedOptionId: selected, isCorrect, mistakeType, timeSeconds, flagged: flagged.has(question.id) },
    ]);
    if (mode === "learning") {
      setShowFeedback(true);
    } else {
      goNext();
    }
  }

  function goNext() {
    setShowFeedback(false);
    setSelected(null);
    if (index + 1 >= questions.length) {
      navigate("/practice/results", { state: { attempts, questions } });
    } else {
      setIndex((i) => i + 1);
    }
  }

  const lastAttempt = attempts[attempts.length - 1];
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

          <Button size="lg" fullWidth className="mt-4" onClick={submitAnswer} disabled={!selected || (mode === "learning" && showFeedback)}>
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
