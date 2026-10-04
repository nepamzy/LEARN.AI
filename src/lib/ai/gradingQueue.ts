import { loadLocal, saveLocal } from "../storage";
import type { GradingRequest, GradingResult, SubmissionMethod } from "./types";

// A submission on its way to a saved grade. Kept on-device until the grade is
// persisted. `result` is set once the AI has marked it, so a failed save can be
// retried without paying for a second grade. `recordId` is reused on retry so
// the save stays idempotent. One job per assignment: a resubmission replaces it.
export interface PendingGrading {
  assignmentId: string;
  request: GradingRequest;
  submittedAt: string;
  submissionMethod: SubmissionMethod;
  recordId: string;
  result?: GradingResult;
  gradedAt?: string;
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
