import { useLocation, useNavigate } from "react-router-dom";
import { Trophy, Clock, AlertCircle } from "lucide-react";
import type { Question } from "../../lib/types";
import { getSubject, getTopic } from "../../lib/mockData";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { StatusTag } from "../../components/ui/StatusTag";
import { EmptyState } from "../../components/ui/EmptyState";

interface NavState {
  answers: Record<string, string>;
  questions: Question[];
}

export function ExamSimulatorResultsPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { answers = {}, questions = [] } = (state as NavState) ?? {};

  if (questions.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Trophy className="size-6" aria-hidden="true" />}
          title="No recent mock exam"
          description="Take a mock exam to see your results here."
          action={<Button onClick={() => navigate("/exam")}>Start a mock exam</Button>}
        />
      </Card>
    );
  }

  const correct = questions.filter((q) => answers[q.id] === q.correctOptionId).length;
  const estimatedPct = Math.round((correct / questions.length) * 100);
  const bySubject = Array.from(new Set(questions.map((q) => q.subjectId))).map((subjectId) => {
    const qs = questions.filter((q) => q.subjectId === subjectId);
    const right = qs.filter((q) => answers[q.id] === q.correctOptionId).length;
    return { subjectId, right, total: qs.length };
  });
  const vulnerable = bySubject.filter((s) => s.right / s.total < 0.6);

  return (
    <div className="pb-6 space-y-5 max-w-2xl">
      <Card className="text-center bg-sage-surface border-sage/20">
        <Trophy className="size-8 text-sage mx-auto mb-2" aria-hidden="true" />
        <p className="text-sm font-semibold text-ink-secondary">Estimated performance</p>
        <p className="text-4xl font-bold text-ink mt-1">{estimatedPct}%</p>
        <p className="text-xs text-ink-secondary mt-2 max-w-xs mx-auto">
          This is an estimate based on this mock, not a guaranteed exam score.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-2.5">
        <Card className="text-center">
          <p className="text-lg font-bold text-ink">{correct}/{questions.length}</p>
          <p className="text-xs text-ink-secondary">Correct answers</p>
        </Card>
        <Card className="text-center">
          <Clock className="size-5 text-sage mx-auto mb-0.5" aria-hidden="true" />
          <p className="text-xs text-ink-secondary">Time management: steady pacing throughout</p>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold text-ink text-[17px] mb-3">By subject</h3>
        <ul className="space-y-2.5">
          {bySubject.map(({ subjectId, right, total }) => (
            <li key={subjectId} className="flex items-center justify-between">
              <p className="font-medium text-[15px] text-ink">{getSubject(subjectId)?.name}</p>
              <StatusTag tone={right / total >= 0.8 ? "sage" : right / total >= 0.6 ? "info" : "amber"}>
                {right}/{total}
              </StatusTag>
            </li>
          ))}
        </ul>
      </Card>

      {vulnerable.length > 0 && (
        <Card className="border-amber/20 bg-amber-surface">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="size-5 text-amber shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-ink text-[16px] mb-1">Your recovery plan</h3>
              <p className="text-[15px] text-ink leading-relaxed">
                {vulnerable.map((v) => getSubject(v.subjectId)?.name).join(" and ")} showed the most room to grow this
                mock. We've added focused review sessions for these to your plan this week.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-2.5">
        {questions.map((q) => {
          const topic = getTopic(q.topicId);
          const isCorrect = answers[q.id] === q.correctOptionId;
          return (
            <Card key={q.id} padded={false}>
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{q.prompt}</p>
                  <p className="text-xs text-ink-secondary mt-0.5">{topic?.name}</p>
                </div>
                <StatusTag tone={isCorrect ? "sage" : "error"}>{isCorrect ? "Correct" : "Missed"}</StatusTag>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <Button fullWidth onClick={() => navigate("/learn")}>
          Go to my revision plan
        </Button>
        <Button fullWidth variant="secondary" onClick={() => navigate("/exam")}>
          Try another mock
        </Button>
      </div>
    </div>
  );
}
