import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Download, RotateCcw, Sparkles, UserRound, FileQuestion, Clock3, AlertTriangle } from "lucide-react";
import { assignments, getSubject } from "../../lib/mockData";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusTag } from "../../components/ui/StatusTag";
import { ListSkeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/useToast";
import { formatDate } from "../../lib/utils";
import { downloadAssignmentReportPdf } from "../../lib/pdf/assignmentReport";
import { fetchLatestGradedRecord } from "../../lib/api/gradedSubmissions";
import { recordToReportAssignment, type GradedRecord } from "../../lib/ai/gradedRecord";

type LiveGrade =
  | { phase: "loading" }
  | { phase: "error" }
  | { phase: "ready"; record: GradedRecord | null };

export function AssignmentReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [live, setLive] = useState<LiveGrade>({ phase: "loading" });
  const [attempt, setAttempt] = useState(0);
  const base = assignments.find((a) => a.id === id);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchLatestGradedRecord(id)
      .then((record) => {
        if (!cancelled) setLive({ phase: "ready", record });
      })
      .catch(() => {
        if (!cancelled) setLive({ phase: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  if (!base) {
    return (
      <Card>
        <EmptyState icon={<FileQuestion className="size-6" aria-hidden="true" />} title="Report not found" />
      </Card>
    );
  }

  if (live.phase === "loading") {
    return (
      <div role="status" aria-label="Loading your report">
        <ListSkeleton rows={2} />
      </div>
    );
  }

  if (live.phase === "error") {
    return (
      <Card>
        <EmptyState
          icon={<AlertTriangle className="size-6" aria-hidden="true" />}
          title="We couldn't load this report"
          description="Check your connection and try again."
          action={
            <Button size="sm" variant="secondary" onClick={() => setAttempt((n) => n + 1)}>
              Try again
            </Button>
          }
        />
      </Card>
    );
  }

  const record = live.record;
  const isLive = record !== null;

  if (!record && base.status !== "returned") {
    return (
      <Card>
        <EmptyState
          icon={<Clock3 className="size-6" aria-hidden="true" />}
          title="This submission is still being reviewed"
          description={
            base.source === "teacher"
              ? "Your teacher hasn't marked this yet. We'll let you know as soon as it's ready."
              : "Astra is still grading this submission."
          }
          action={<Link to="/assignments" className="text-sm font-semibold text-sage">Back to assignments</Link>}
        />
      </Card>
    );
  }

  const assignment = record ? recordToReportAssignment(record, base) : base;
  const subject = getSubject(assignment.subjectId);
  const finalScore = assignment.teacherOverride?.adjustedScore ?? assignment.totalScore ?? 0;
  const pct = Math.round((finalScore / assignment.maxScore) * 100);

  async function handleDownloadPdf() {
    setGeneratingPdf(true);
    try {
      // Yield a frame so the loading state actually paints before the
      // (synchronous, CPU-bound) PDF render blocks the main thread.
      await new Promise((resolve) => setTimeout(resolve, 0));
      downloadAssignmentReportPdf(assignment, subject?.name);
      show("Your PDF report has downloaded.", "success");
    } catch {
      show("Couldn't generate the PDF just now. Please try again.", "error");
    } finally {
      setGeneratingPdf(false);
    }
  }

  return (
    <div className="pb-6 space-y-4 pt-2 max-w-2xl">
      <div>
        <p className="text-sm font-semibold text-ink-secondary">{subject?.name}</p>
        <h2 className="text-xl font-bold text-ink mt-0.5">{assignment.title}</h2>
        <p className="text-sm text-ink-secondary mt-1">
          {isLive ? "Graded" : "Returned"} {assignment.returnedAt && formatDate(assignment.returnedAt.slice(0, 10))}
        </p>
      </div>

      <Card className="text-center bg-sage-surface border-sage/20">
        <p className="text-sm font-semibold text-ink-secondary">{isLive ? "AI practice mark" : "Total mark"}</p>
        <p className="text-4xl font-bold text-ink mt-1">
          {finalScore}<span className="text-xl text-ink-secondary">/{assignment.maxScore}</span>
        </p>
        <p className="text-xs text-ink-secondary mt-1">{pct}%</p>
        {isLive && (
          <p className="text-xs text-ink-secondary mt-2">Rubric-based guidance from Astra, not a teacher-approved grade.</p>
        )}
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
            <li key={r.id}>
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-ink">{r.name}</span>
                <StatusTag tone="sage">{r.score ?? "—"}/{r.maxScore}</StatusTag>
              </div>
              {r.feedback && <p className="text-[15px] text-ink-secondary mt-1 leading-relaxed">{r.feedback}</p>}
            </li>
          ))}
        </ul>
      </Card>

      {assignment.strengths?.length ? (
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
      ) : null}

      {assignment.improvements?.length ? (
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
      ) : null}

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
        <Button fullWidth variant="secondary" onClick={() => void handleDownloadPdf()} loading={generatingPdf}>
          {!generatingPdf && <Download className="size-4" aria-hidden="true" />}
          {generatingPdf ? "Preparing PDF…" : "Download PDF report"}
        </Button>
      </div>
    </div>
  );
}
