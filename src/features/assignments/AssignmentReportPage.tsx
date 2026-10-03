import { useParams, useNavigate, Link } from "react-router-dom";
import { Download, RotateCcw, Sparkles, UserRound, FileQuestion, Clock3 } from "lucide-react";
import { assignments, getSubject } from "../../lib/mockData";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusTag } from "../../components/ui/StatusTag";
import { useToast } from "../../components/ui/Toast";
import { formatDate } from "../../lib/utils";

export function AssignmentReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const assignment = assignments.find((a) => a.id === id);

  if (!assignment) {
    return (
      <Card>
        <EmptyState icon={<FileQuestion className="size-6" aria-hidden="true" />} title="Report not found" />
      </Card>
    );
  }

  if (assignment.status !== "returned") {
    return (
      <Card>
        <EmptyState
          icon={<Clock3 className="size-6" aria-hidden="true" />}
          title="This submission is still being reviewed"
          description={
            assignment.source === "teacher"
              ? "Your teacher hasn't marked this yet. We'll let you know as soon as it's ready."
              : "Astra is still grading this submission."
          }
          action={<Link to="/assignments" className="text-sm font-semibold text-sage">Back to assignments</Link>}
        />
      </Card>
    );
  }

  const subject = getSubject(assignment.subjectId);
  const finalScore = assignment.teacherOverride?.adjustedScore ?? assignment.totalScore ?? 0;
  const pct = Math.round((finalScore / assignment.maxScore) * 100);

  return (
    <div className="pb-6 space-y-4 pt-2 max-w-2xl">
      <div>
        <p className="text-sm font-semibold text-ink-secondary">{subject?.name}</p>
        <h2 className="text-xl font-bold text-ink mt-0.5">{assignment.title}</h2>
        <p className="text-sm text-ink-secondary mt-1">Returned {assignment.returnedAt && formatDate(assignment.returnedAt.slice(0, 10))}</p>
      </div>

      <Card className="text-center bg-sage-surface border-sage/20">
        <p className="text-sm font-semibold text-ink-secondary">Total mark</p>
        <p className="text-4xl font-bold text-ink mt-1">
          {finalScore}<span className="text-xl text-ink-secondary">/{assignment.maxScore}</span>
        </p>
        <p className="text-xs text-ink-secondary mt-1">{pct}%</p>
      </Card>

      {assignment.teacherOverride && (
        <Card className="border-info/20 bg-info-surface">
          <div className="flex items-center gap-2 mb-1.5">
            <UserRound className="size-4 text-info" aria-hidden="true" />
            <p className="font-semibold text-ink text-[15px]">
              Teacher {assignment.teacherOverride.status === "adjusted" ? "adjusted this mark" : "approved this mark"}
            </p>
          </div>
          <p className="text-[15px] text-ink leading-relaxed">{assignment.teacherOverride.comment}</p>
        </Card>
      )}

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="size-4 text-sage" aria-hidden="true" />
          <h3 className="font-bold text-ink text-[16px]">Rubric breakdown</h3>
        </div>
        <ul className="space-y-2.5">
          {assignment.rubric.map((r) => (
            <li key={r.id} className="flex items-center justify-between">
              <span className="text-[15px] text-ink">{r.name}</span>
              <StatusTag tone="sage">{r.score ?? "—"}/{r.maxScore}</StatusTag>
            </li>
          ))}
        </ul>
      </Card>

      {assignment.strengths && (
        <Card>
          <h3 className="font-bold text-ink text-[16px] mb-2.5">Strengths</h3>
          <ul className="space-y-2 list-disc pl-5">
            {assignment.strengths.map((s, i) => (
              <li key={i} className="text-[15px] text-ink leading-relaxed">
                {s}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {assignment.improvements && (
        <Card>
          <h3 className="font-bold text-ink text-[16px] mb-2.5">Specific improvements</h3>
          <ul className="space-y-2 list-disc pl-5">
            {assignment.improvements.map((s, i) => (
              <li key={i} className="text-[15px] text-ink leading-relaxed">
                {s}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {assignment.modelAnswerExcerpt && (
        <Card className="bg-[#F8F7F2]">
          <h3 className="font-bold text-ink text-[16px] mb-2">What a stronger answer looks like</h3>
          <p className="text-[15px] text-ink leading-relaxed italic">"{assignment.modelAnswerExcerpt}"</p>
        </Card>
      )}

      {assignment.nextSteps && (
        <Card className="border-sage/20 bg-sage-surface">
          <h3 className="font-bold text-ink text-[16px] mb-2.5">What to study next</h3>
          <ul className="space-y-1.5">
            {assignment.nextSteps.map((s, i) => (
              <li key={i} className="text-[15px] text-ink leading-relaxed">
                • {s}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
        <Button fullWidth variant="secondary" onClick={() => navigate(`/assignments/${assignment.id}`)}>
          <RotateCcw className="size-4" aria-hidden="true" /> Redraft &amp; resubmit
        </Button>
        <Button fullWidth variant="secondary" onClick={() => show("Your PDF report is being prepared and will download shortly.", "success")}>
          <Download className="size-4" aria-hidden="true" /> Download PDF report
        </Button>
      </div>
    </div>
  );
}
