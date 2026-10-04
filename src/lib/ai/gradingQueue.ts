import { loadLocal, saveLocal } from "../storage";
import type { GradingRequest, GradingResult, SubmissionMethod } from "./types";

// A submission on its way to a saved grade. Kept on-device until the grade is
// persisted. `result` is set once the AI has marked it, so a failed save can be
// retried without paying for a second grade. `recordId` is reused on retry so
// the save stays idempotent. One job per assignment: a resubmission replaces it.
// "file" jobs record that a submission happened even though Astra can't mark
// uploaded files yet, so the submission doesn't vanish on reload.
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
export function resumeAction(job: PendingGrading): ResumeAction {
  if (job.submissionMethod === "file") return "file-not-graded";
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
