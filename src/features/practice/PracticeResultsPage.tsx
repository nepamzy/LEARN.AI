import { useLocation, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, Clock, Target, ArrowRight } from "lucide-react";
import type { PracticeAttempt, Question } from "../../lib/types";
import { getSubject, getTopic } from "../../lib/mockData";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { StatusTag } from "../../components/ui/StatusTag";
import { mistakeLabel } from "./mistakeClassifier";
import { EmptyState } from "../../components/ui/EmptyState";
import { PencilLine } from "lucide-react";

interface NavState {
  attempts: PracticeAttempt[];
  questions: Question[];
}

export function PracticeResultsPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { attempts = [], questions = [] } = (state as NavState) ?? {};

  if (attempts.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<PencilLine className="size-6" aria-hidden="true" />}
          title="No recent practice session"
          description="Start a practice session to see your results here."
          action={<Button onClick={() => navigate("/practice")}>Start practice</Button>}
        />
      </Card>
    );
  }

  const correctCount = attempts.filter((a) => a.isCorrect).length;
  const accuracy = Math.round((correctCount / attempts.length) * 100);
  const totalSeconds = attempts.reduce((s, a) => s + a.timeSeconds, 0);
  const minutes = Math.round(totalSeconds / 60) || 1;
  const mistakes = attempts.filter((a) => !a.isCorrect && a.mistakeType);

  const topicIds = Array.from(new Set(questions.map((q) => q.topicId)));
  const topicBreakdown = topicIds.map((topicId) => {
    const qIds = questions.filter((q) => q.topicId === topicId).map((q) => q.id);
    const topicAttempts = attempts.filter((a) => qIds.includes(a.questionId));
    const right = topicAttempts.filter((a) => a.isCorrect).length;
    return { topicId, right, total: topicAttempts.length };
  });

  const weakestTopic = topicBreakdown.slice().sort((a, b) => a.right / a.total - b.right / b.total)[0];
  const dominantMistake = mistakes.length
    ? mistakes.reduce<Record<string, number>>((acc, m) => {
        acc[m.mistakeType!] = (acc[m.mistakeType!] ?? 0) + 1;
        return acc;
      }, {})
    : {};
  const topMistakeType = Object.entries(dominantMistake).sort((a, b) => b[1] - a[1])[0]?.[0] as
    | "concept"
    | "careless"
    | "time-pressure"
    | undefined;

  return (
    <div className="pb-6 space-y-5 max-w-2xl">
      <div className="text-center space-y-3 py-2">
        <span className="mx-auto size-14 rounded-full bg-sage-surface flex items-center justify-center">
          <CheckCircle2 className="size-7 text-sage" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-bold text-ink">Session complete</h2>
        <p className="text-[15px] text-ink-secondary">
          {correctCount} of {attempts.length} correct — you're building real progress here.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <Card className="text-center">
          <Target className="size-5 text-sage mx-auto mb-1" aria-hidden="true" />
          <p className="text-lg font-bold text-ink">{accuracy}%</p>
          <p className="text-xs text-ink-secondary">Accuracy</p>
        </Card>
        <Card className="text-center">
          <Clock className="size-5 text-sage mx-auto mb-1" aria-hidden="true" />
          <p className="text-lg font-bold text-ink">{minutes} min</p>
          <p className="text-xs text-ink-secondary">Time used</p>
        </Card>
        <Card className="text-center">
          <CheckCircle2 className="size-5 text-sage mx-auto mb-1" aria-hidden="true" />
          <p className="text-lg font-bold text-ink">{attempts.length}</p>
          <p className="text-xs text-ink-secondary">Questions</p>
        </Card>
      </div>

      {topMistakeType && (
        <Card className="bg-amber-surface border-amber/20">
          <p className="text-xs font-semibold text-amber uppercase tracking-wide mb-1">Most important insight</p>
          <p className="text-[15px] text-ink leading-relaxed">
            Most of your missed questions this session were a{" "}
            <strong>{mistakeLabel[topMistakeType].toLowerCase()}</strong>.{" "}
            {topMistakeType === "careless" && "You likely know the method — slowing down slightly should help."}
            {topMistakeType === "concept" && "Worth revisiting the method itself before your next session."}
            {topMistakeType === "time-pressure" && "Try a few more of these untimed this week to confirm the method is solid."}
          </p>
        </Card>
      )}

      <Card>
        <h3 className="font-bold text-ink text-[17px] mb-3">Topic breakdown</h3>
        <ul className="space-y-2.5">
          {topicBreakdown.map(({ topicId, right, total }) => {
            const topic = getTopic(topicId);
            const subject = topic ? getSubject(topic.subjectId) : undefined;
            return (
              <li key={topicId} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[15px] text-ink">{topic?.name}</p>
                  <p className="text-xs text-ink-secondary">{subject?.name}</p>
                </div>
                <StatusTag tone={right === total ? "sage" : right === 0 ? "error" : "amber"}>
                  {right}/{total}
                </StatusTag>
              </li>
            );
          })}
        </ul>
      </Card>

      {weakestTopic && (
        <Card>
          <h3 className="font-bold text-ink text-[17px] mb-1">What to revise next</h3>
          <p className="text-[15px] text-ink-secondary mb-4">
            {getTopic(weakestTopic.topicId)?.name} showed the most room to grow this session.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button fullWidth onClick={() => navigate("/learn")}>
              Add weak topics to today's plan <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button fullWidth variant="secondary" onClick={() => navigate("/tutor")}>
              Review mistakes with Astra
            </Button>
          </div>
        </Card>
      )}

      <Link to="/practice" className="block text-center text-sm font-semibold text-sage hover:text-sage-hover py-2">
        Start another session
      </Link>
    </div>
  );
}
