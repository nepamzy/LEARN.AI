import { useEffect, useRef, useState } from "react";
import { Sparkles, AlertTriangle, RotateCcw, FileQuestion } from "lucide-react";
import type { UniversityCourse } from "../../lib/types";
import type { GradingResult } from "../../lib/ai/types";
import { AiRateLimitError, AiUnavailableError } from "../../lib/ai/types";
import { generateAssignment } from "../../lib/ai/assignmentGeneration";
import { gradeSubmission } from "../../lib/ai/grading";
import type { PersistedUniversityAssignment } from "../../lib/ai/universityAssignmentRecord";
import { saveUniversityAssignment, fetchLatestUniversityAssignment } from "../../lib/api/universityAssignments";
import { resolveActiveCourse } from "../../lib/universityCourseSelection";
import { saveGradedRecord, fetchLatestGradedRecord } from "../../lib/api/gradedSubmissions";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { TextArea } from "../../components/ui/Input";
import { ListSkeleton } from "../../components/ui/Skeleton";
import { GradingFeedback, type GradingState } from "./components/GradingFeedback";

// Phase 7b: assignments were never AI-generated before this phase — every
// mock assignment (lib/mockData.ts) is static, hand-authored content. This is
// genuinely new functionality, not a reuse of an existing generation path
// (none existed). Grading, once the student submits, DOES reuse the existing
// gradeSubmission()/ai-proxy "grade" path unchanged (§6).
// Phase 7c §1b: a generated assignment now gets a real id and is persisted
// (university_assignments table) the moment it's generated, and its grade is
// persisted through the SAME graded_submissions table/pipeline secondary
// assignments already use (assignment_id is a plain text column, so a
// university assignment's uuid fits it exactly like a secondary mock id
// would) — both survive a reload now, the same way Phase 5/6 already made
// secondary grading survive one.
type Phase =
  | { kind: "loading" }
  | { kind: "idle" }
  | { kind: "generating" }
  | { kind: "generation-failed" }
  | { kind: "ready"; assignment: PersistedUniversityAssignment };

export function UniversityAssignmentWorkspace({ courses }: { courses: UniversityCourse[] }) {
  const [courseId, setCourseId] = useState(courses[0]?.id);
  const course = resolveActiveCourse(courses, courseId);

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
            onChange={(e) => setCourseId(e.target.value)}
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

      {course && <AssignmentWorkspaceForCourse key={course.id} course={course} />}
    </div>
  );
}

// Keyed by course.id above, same pattern TopicDetailPage uses: switching
// course fully remounts this with fresh state, instead of needing to
// manually reset half a dozen state values inside an effect.
function AssignmentWorkspaceForCourse({ course }: { course: UniversityCourse }) {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [responseText, setResponseText] = useState("");
  const [grading, setGrading] = useState<GradingState | null>(null);
  const [retrying, setRetrying] = useState(false);
  // Holds the one grading result awaiting a successful save, so a retry
  // after a failed save resaves the SAME grade instead of spending another
  // AI call — same ordering rule AssignmentDetailPage's saveGrade follows.
  const pendingGrade = useRef<{ recordId: string; result: GradingResult } | null>(null);

  // Resume whatever this student last generated for this course (if
  // anything), and whether it was already graded — rather than always
  // starting from a blank slate.
  useEffect(() => {
    let cancelled = false;
    fetchLatestUniversityAssignment(course.name)
      .then(async (persisted) => {
        if (cancelled) return;
        if (!persisted) {
          setPhase({ kind: "idle" });
          return;
        }
        setPhase({ kind: "ready", assignment: persisted });
        try {
          const record = await fetchLatestGradedRecord(persisted.id);
          if (!cancelled && record) setGrading({ status: "graded", result: record.result });
        } catch {
          // Couldn't check for an existing grade — leave it ungraded; the
          // student can still submit, same as if nothing had been graded yet.
        }
      })
      .catch(() => {
        if (!cancelled) setPhase({ kind: "idle" });
      });
    return () => {
      cancelled = true;
    };
  }, [course.name]);

  async function handleGenerate() {
    setPhase({ kind: "generating" });
    setResponseText("");
    setGrading(null);
    pendingGrade.current = null;
    try {
      const generated = await generateAssignment(course.name);
      const assignment: PersistedUniversityAssignment = {
        ...generated,
        id: crypto.randomUUID(),
        courseName: course.name,
        createdAt: new Date().toISOString(),
      };
      await saveUniversityAssignment(assignment);
      setPhase({ kind: "ready", assignment });
    } catch {
      setPhase({ kind: "generation-failed" });
    }
  }

  // Order matters, same as AssignmentDetailPage's saveGrade: the grade is
  // shown only once it's actually saved, never before.
  async function saveGrade(assignment: PersistedUniversityAssignment, recordId: string, result: GradingResult) {
    try {
      await saveGradedRecord({
        id: recordId,
        assignmentId: assignment.id,
        submissionMethod: "type",
        submittedText: responseText.trim(),
        gradedAt: new Date().toISOString(),
        result,
      });
      setGrading({ status: "graded", result });
    } catch {
      setGrading({ status: "save-failed" });
    }
  }

  async function submitForGrading() {
    if (phase.kind !== "ready") return;
    setRetrying(true);
    try {
      const result = await gradeSubmission({
        assignmentTitle: phase.assignment.title,
        objective: phase.assignment.objective,
        rubric: phase.assignment.rubric,
        studentText: responseText.trim(),
        courseName: course.name,
      });
      pendingGrade.current = { recordId: crypto.randomUUID(), result };
      await saveGrade(phase.assignment, pendingGrade.current.recordId, result);
    } catch (err) {
      if (err instanceof AiUnavailableError) setGrading({ status: "pending", reason: "not-configured" });
      else if (err instanceof AiRateLimitError) setGrading({ status: "failed", reason: "rate-limited" });
      else setGrading({ status: "failed" });
    } finally {
      setRetrying(false);
    }
  }

  async function retry() {
    // A failed SAVE only needs the save retried — no AI call is spent again.
    if (grading?.status === "save-failed" && pendingGrade.current && phase.kind === "ready") {
      setRetrying(true);
      await saveGrade(phase.assignment, pendingGrade.current.recordId, pendingGrade.current.result);
      setRetrying(false);
      return;
    }
    void submitForGrading();
  }

  if (phase.kind === "loading") {
    return (
      <div role="status" aria-label="Loading your assignment">
        <ListSkeleton rows={2} />
      </div>
    );
  }

  return (
    <>
      {phase.kind === "idle" && (
        <Card>
          <EmptyState
            icon={<Sparkles className="size-6" aria-hidden="true" />}
            title={`Request an assignment for ${course.name}`}
            description="Astra will write a short practice assignment and rubric for this course, then mark your response the same way it marks any assignment."
            action={
              <Button onClick={() => void handleGenerate()}>
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
            <p className="text-sm text-ink-secondary mb-3">{course.name}</p>
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

          {grading && <GradingFeedback state={grading} rubric={phase.assignment.rubric} onRetry={() => void retry()} retrying={retrying} />}

          {grading?.status === "graded" && (
            <Button variant="secondary" fullWidth onClick={() => void handleGenerate()}>
              <FileQuestion className="size-4" aria-hidden="true" /> Request another assignment
            </Button>
          )}
        </>
      )}
    </>
  );
}
