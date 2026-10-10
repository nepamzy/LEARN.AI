import { loadLocal, saveLocal } from "../storage";
import type { GradingRequest, GradingResult, SubmissionMethod } from "./types";

// A submission on its way to a saved grade. Kept on-device until the grade is
// persisted. `result` is set once the AI has marked it, so a failed save can be
// retried without paying for a second grade. `recordId` is reused on retry so
// the save stays idempotent. One job per assignment: a resubmission replaces it.
// "file" is kept as its own submissionMethod tag for provenance (this grade
// came from an uploaded file, not typed text), but — since Phase 7d §1b — a
// "file" job is built with the SAME real, already-confirmed extracted text a
// "type"/"photo" job carries, so it resumes exactly like either of them.
export interface PendingGrading {
  assignmentId: string;
  request: GradingRequest;
  submittedAt: string;
  submissionMethod: SubmissionMethod | "file";
  recordId: string;
  result?: GradingResult;
  gradedAt?: string;
}

export type ResumeAction = "file-not-graded" | "save-only" | "await-user";

// Auto-resume only when no AI call is needed. A job with a result just needs its
// save retried, which spends nothing. A job without one would re-run a paid
// grading call the student never saw complete, so that waits for an explicit tap.
// "file-not-graded" is kept only as a defensive fallback for the (no longer
// normally reachable) case of a job somehow queued with no text at all —
// see request.studentText, not submissionMethod, which actually decides it.
export function resumeAction(job: PendingGrading): ResumeAction {
  if (job.submissionMethod === "file" && !job.request.studentText) return "file-not-graded";
  if (job.result) return "save-only";
  return "await-user";
}

const KEY = "pendingGrading";

function readAll(): PendingGrading[] {
  return loadLocal<PendingGrading[]>(KEY, []);
}

export function getPendingGrading(assignmentId: string): PendingGrading | undefined {
  return readAll().find((p) => p.assignmentId === assignmentId);
}

export function queuePendingGrading(job: PendingGrading): void {
  saveLocal(KEY, [...readAll().filter((p) => p.assignmentId !== job.assignmentId), job]);
}

export function clearPendingGrading(assignmentId: string): void {
  saveLocal(KEY, readAll().filter((p) => p.assignmentId !== assignmentId));
}
