import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, FileQuestion, Sparkles, UserRound, ArrowLeft } from "lucide-react";
import { assignments, getSubject, getTopic } from "../../lib/mockData";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Tabs } from "../../components/ui/Tabs";
import { EmptyState } from "../../components/ui/EmptyState";
import { SubmissionTypeResponse } from "./components/SubmissionTypeResponse";
import { SubmissionFileUpload } from "./components/SubmissionFileUpload";
import { SubmissionPhotoOCR } from "./components/SubmissionPhotoOCR";
import { GradingFeedback, type GradingState } from "./components/GradingFeedback";
import { formatDate, minutesToLabel } from "../../lib/utils";
import { gradeSubmission } from "../../lib/ai/grading";
import { isAiConfigured } from "../../lib/ai/proxyClient";
import { clearPendingGrading, getPendingGrading, queuePendingGrading, type PendingGrading } from "../../lib/ai/gradingQueue";
import { AiRateLimitError, AiUnavailableError, type GradingResult } from "../../lib/ai/types";
import { saveGradedRecord } from "../../lib/api/gradedSubmissions";

function currentTime(): Date {
  return new Date();
}

function gradingFailureState(err: unknown): GradingState {
  if (err instanceof AiUnavailableError) return { status: "pending", reason: "not-configured" };
  if (err instanceof AiRateLimitError) return { status: "failed", reason: "rate-limited" };
  return { status: "failed" };
}

export function AssignmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const assignment = assignments.find((a) => a.id === id);
  const [method, setMethod] = useState("type");
  const [typedText, setTypedText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  const [grading, setGrading] = useState<GradingState | null>(null);
  const [retrying, setRetrying] = useState(false);

  if (!assignment) {
    return (
      <Card>
        <EmptyState
          icon={<FileQuestion className="size-6" aria-hidden="true" />}
          title="This assignment isn't available"
          description="It may have been archived or removed."
          action={<Link to="/assignments" className="text-sm font-semibold text-sage">Back to assignments</Link>}
        />
      </Card>
    );
  }

  const subject = getSubject(assignment.subjectId);
  const topic = assignment.topicId ? getTopic(assignment.topicId) : undefined;
  const canSubmit = (method === "type" && typedText.trim().length > 0) || (method === "file" && !!file) || (method === "photo" && !!ocrText);

  // Order matters: the grade is kept on-device before the save, and shown only
  // after the save succeeds, so a student never sees a grade that isn't stored.
  async function completeGrading(job: PendingGrading) {
    setRetrying(true);
    let result: GradingResult | undefined = job.result;
    try {
      if (!result) {
        result = await gradeSubmission(job.request);
        queuePendingGrading({ ...job, result, gradedAt: currentTime().toISOString() });
      }
    } catch (err) {
      setGrading(gradingFailureState(err));
      setRetrying(false);
      return;
    }
    if (!result) return;

    try {
      await saveGradedRecord({
        id: job.recordId,
        assignmentId: job.assignmentId,
        submissionMethod: job.submissionMethod,
        submittedText: job.request.studentText,
        gradedAt: getPendingGrading(job.assignmentId)?.gradedAt ?? job.submittedAt,
        result,
      });
      clearPendingGrading(job.assignmentId);
      setGrading({ status: "graded", result });
    } catch {
      setGrading({ status: "save-failed" });
    } finally {
      setRetrying(false);
    }
  }

  function handleSubmit() {
    const now = currentTime();
    setSubmittedAt(now);
    const studentText = method === "type" ? typedText.trim() : method === "photo" ? (ocrText ?? "") : "";
    if (!studentText) {
      setGrading({ status: "pending", reason: "file" });
      return;
    }
    const job: PendingGrading = {
      assignmentId: assignment!.id,
      request: {
        assignmentTitle: assignment!.title,
        objective: assignment!.objective,
        rubric: assignment!.rubric,
        studentText,
      },
      submittedAt: now.toISOString(),
      submissionMethod: method === "photo" ? "photo" : "type",
      recordId: crypto.randomUUID(),
    };
    queuePendingGrading(job);
    if (!isAiConfigured()) {
      setGrading({ status: "pending", reason: "not-configured" });
      return;
    }
    void completeGrading(job);
  }

  function retryGrading() {
    const job = getPendingGrading(assignment!.id);
    if (job) void completeGrading(job);
  }

  if (submittedAt) {
    return (
      <div className="max-w-lg mx-auto space-y-4 pt-2 pb-6">
        <Card className="text-center space-y-4 py-8">
          <span className="mx-auto size-14 rounded-full bg-sage-surface flex items-center justify-center">
            <CheckCircle2 className="size-7 text-sage" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-ink">Submitted</h2>
            <p className="text-[15px] text-ink-secondary mt-1">
              "{assignment.title}" was submitted on {submittedAt.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.
            </p>
          </div>
          {assignment.source === "teacher" && (
            <p className="text-sm text-ink-secondary">Your teacher will review this before marks are finalised.</p>
          )}
        </Card>

        {grading && (
          <GradingFeedback state={grading} rubric={assignment.rubric} onRetry={retryGrading} retrying={retrying} />
        )}

        <Button fullWidth onClick={() => navigate("/assignments")}>
          Back to assignments
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-6 space-y-4 pt-2 max-w-2xl">
      <button onClick={() => navigate("/assignments")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-secondary hover:text-sage">
        <ArrowLeft className="size-4" aria-hidden="true" /> Assignments
      </button>

      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-semibold text-ink-secondary">{subject?.name}</span>
          {topic && <span className="text-sm text-ink-secondary">· {topic.name}</span>}
          <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-secondary ml-auto">
            {assignment.source === "ai" ? <Sparkles className="size-3" aria-hidden="true" /> : <UserRound className="size-3" aria-hidden="true" />}
            {assignment.source === "ai" ? "AI-set" : "Teacher-set"}
          </span>
        </div>
        <h2 className="text-xl font-bold text-ink">{assignment.title}</h2>
        <p className="text-sm text-ink-secondary mt-1">
          Due {formatDate(assignment.dueDate)} · about {minutesToLabel(assignment.estimatedMinutes)}
        </p>
      </div>

      <Card>
        <h3 className="font-bold text-ink text-[16px] mb-1.5">Learning objective</h3>
        <p className="text-[15px] text-ink-secondary">{assignment.objective}</p>
      </Card>

      <Card>
        <h3 className="font-bold text-ink text-[16px] mb-1.5">Instructions</h3>
        <p className="text-[15px] text-ink leading-relaxed">{assignment.instructions}</p>
      </Card>

      <Card>
        <h3 className="font-bold text-ink text-[16px] mb-3">How this will be marked</h3>
        <ul className="space-y-2">
          {assignment.rubric.map((r) => (
            <li key={r.id} className="flex items-center justify-between text-[15px]">
              <span className="text-ink">{r.name}</span>
              <span className="text-ink-secondary font-medium">{r.maxScore} marks</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h3 className="font-bold text-ink text-[16px] mb-3">Submit your work</h3>
        <div className="mb-3">
          <Tabs
            aria-label="Submission method"
            active={method}
            onChange={setMethod}
            tabs={[
              { id: "type", label: "Type response" },
              { id: "file", label: "Upload file" },
              { id: "photo", label: "Photo" },
            ]}
          />
        </div>

        {method === "type" && <SubmissionTypeResponse assignmentId={assignment.id} onChange={setTypedText} />}
        {method === "file" && <SubmissionFileUpload onFileReady={setFile} />}
        {method === "photo" && <SubmissionPhotoOCR onConfirmed={setOcrText} />}
      </Card>

      <Button size="lg" fullWidth disabled={!canSubmit} onClick={handleSubmit}>
        Submit assignment
      </Button>
    </div>
  );
}
