import { loadLocal, saveLocal } from "../storage";
import type { GradingRequest } from "./types";

// Submissions waiting for AI feedback, kept on-device until the proxy can mark them.
// One pending job per assignment: a resubmission replaces the earlier one.
export interface PendingGrading {
  assignmentId: string;
  request: GradingRequest;
  submittedAt: string;
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
