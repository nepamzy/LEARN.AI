import { useState } from "react";
import { Sparkles, AlertTriangle, RotateCcw, FileQuestion } from "lucide-react";
import type { UniversityCourse } from "../../lib/types";
import type { GeneratedAssignment, GradingResult } from "../../lib/ai/types";
import { AiRateLimitError, AiUnavailableError } from "../../lib/ai/types";
import { generateAssignment } from "../../lib/ai/assignmentGeneration";
import { gradeSubmission } from "../../lib/ai/grading";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { TextArea } from "../../components/ui/Input";
import { GradingFeedback, type GradingState } from "./components/GradingFeedback";

// Phase 7b: assignments were never AI-generated before this phase — every
// mock assignment (lib/mockData.ts) is static, hand-authored content. This is
// genuinely new functionality, not a reuse of an existing generation path
// (none existed). Grading, once the student submits, DOES reuse the existing
// gradeSubmission()/ai-proxy "grade" path unchanged (§6) — only the
// assignment's own content is freshly generated per request, held in React
// state only (not persisted to graded_submissions — see the Phase 7b report
// for why).
type Phase = { kind: "idle" } | { kind: "generating" } | { kind: "generation-failed" } | { kind: "ready"; assignment: GeneratedAssignment };

export function UniversityAssignmentWorkspace({ courses }: { courses: UniversityCourse[] }) {
  const [courseId, setCourseId] = useState(courses[0]?.id);
  const course = courses.find((c) => c.id === courseId) ?? courses[0];
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [responseText, setResponseText] = useState("");
  const [grading, setGrading] = useState<GradingState | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [lastResult, setLastResult] = useState<GradingResult | null>(null);

  async function handleGenerate() {
    if (!course) return;
    setPhase({ kind: "generating" });
    setResponseText("");
    setGrading(null);
    setLastResult(null);
    try {
      const assignment = await generateAssignment(course.name);
      setPhase({ kind: "ready", assignment });
    } catch {
      setPhase({ kind: "generation-failed" });
    }
  }

  async function submitForGrading() {
    if (phase.kind !== "ready" || !course) return;
    setRetrying(true);
    try {
      const result = await gradeSubmission({
        assignmentTitle: phase.assignment.title,
        objective: phase.assignment.objective,
        rubric: phase.assignment.rubric,
        studentText: responseText.trim(),
        courseName: course.name,
      });
      setLastResult(result);
      setGrading({ status: "graded", result });
    } catch (err) {
      if (err instanceof AiUnavailableError) setGrading({ status: "pending", reason: "not-configured" });
      else if (err instanceof AiRateLimitError) setGrading({ status: "failed", reason: "rate-limited" });
      else setGrading({ status: "failed" });
    } finally {
      setRetrying(false);
    }
  }

  function retry() {
    if (lastResult) {
      setGrading({ status: "graded", result: lastResult });
      return;
    }
    void submitForGrading();
  }

  return (
    <div className="pb-6 space-y-4 pt-2">
      <div>
        <h2 className="text-xl font-bold text-ink">Assignments</h2>
        <p className="text-[15px] text-ink-secondary mt-1">
          Request a practice assignment for any of your courses, written for you on the spot.
        </p>
      </div>

      {courses.length > 1 && (
        <Card>
          <label htmlFor="assignment-course" className="text-sm font-semibold text-ink block mb-2">
            Course
          </label>
          <select
            id="assignment-course"
            value={course?.id}
            onChange={(e) => {
              setCourseId(e.target.value);
              setPhase({ kind: "idle" });
              setGrading(null);
            }}
            className="w-full rounded-xl border border-border-strong px-3.5 py-2.5 text-[15px] bg-surface focus:border-sage transition-colors"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Card>
      )}

      {phase.kind === "idle" && (
        <Card>
          <EmptyState
            icon={<Sparkles className="size-6" aria-hidden="true" />}
            title={`Request an assignment for ${course?.name ?? "your course"}`}
            description="Astra will write a short practice assignment and rubric for this course, then mark your response the same way it marks any assignment."
            action={
              <Button onClick={() => void handleGenerate()} disabled={!course}>
                <Sparkles className="size-4" aria-hidden="true" /> Generate assignment
              </Button>
            }
          />
        </Card>
      )}

      {phase.kind === "generating" && (
        <Card>
          <EmptyState icon={<Sparkles className="size-6 animate-pulse" aria-hidden="true" />} title="Writing your assignment…" description="This usually takes a few seconds." />
        </Card>
      )}

      {phase.kind === "generation-failed" && (
        <div className="flex items-center gap-3 rounded-xl border border-amber/15 bg-amber-surface text-amber px-4 py-3 text-[14px] font-medium">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">Astra couldn't generate an assignment just now.</span>
          <Button size="sm" variant="secondary" onClick={() => void handleGenerate()}>
            <RotateCcw className="size-3.5" aria-hidden="true" /> Try again
          </Button>
        </div>
      )}

      {phase.kind === "ready" && (
        <>
          <Card>
            <h3 className="font-bold text-ink text-[16px] mb-1.5">{phase.assignment.title}</h3>
            <p className="text-sm text-ink-secondary mb-3">{course?.name}</p>
            <p className="text-[15px] text-ink-secondary mb-3">{phase.assignment.objective}</p>
            <p className="text-[15px] text-ink leading-relaxed mb-3">{phase.assignment.instructions}</p>
            <ul className="space-y-1.5 border-t border-border pt-3">
              {phase.assignment.rubric.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink">{r.name}</span>
                  <span className="text-ink-secondary font-medium">{r.maxScore} marks</span>
                </li>
              ))}
            </ul>
          </Card>

          {!grading && (
            <Card className="space-y-3">
              <TextArea
                label="Your response"
                rows={8}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Write your answer here…"
              />
              <Button fullWidth disabled={!responseText.trim()} loading={retrying} onClick={() => void submitForGrading()}>
                Submit for grading
              </Button>
            </Card>
          )}

          {grading && <GradingFeedback state={grading} rubric={phase.assignment.rubric} onRetry={retry} retrying={retrying} />}

          {grading?.status === "graded" && (
            <Button variant="secondary" fullWidth onClick={() => void handleGenerate()}>
              <FileQuestion className="size-4" aria-hidden="true" /> Request another assignment
            </Button>
          )}
        </>
      )}
    </div>
  );
}
