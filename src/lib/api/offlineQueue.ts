// Pending-sync queue for practice attempts made while offline (or while a
// Supabase write fails). Backs the sync indicator already wired into
// AppStateContext — this is what makes "pendingChanges" real instead of a
// fixed placeholder number.

import { loadLocal, saveLocal } from "../storage";
import type { MistakeType } from "../types";

export interface QueuedAttempt {
  localId: string;
  studentId: string;
  questionId: string;
  topicId: string;
  subjectId: string;
  selectedOptionId: string | undefined;
  isCorrect: boolean;
  timeSeconds: number;
  flagged: boolean;
  createdAt: string; // ISO timestamp, set when the attempt happened (not when it syncs)
  mistakeTypeOverride?: MistakeType; // set if classified before queuing (rare — usually classified at sync time)
}

const QUEUE_KEY = "pendingAttempts";

export function getQueuedAttempts(): QueuedAttempt[] {
  return loadLocal<QueuedAttempt[]>(QUEUE_KEY, []);
}

export function enqueueAttempt(attempt: QueuedAttempt): void {
  const queue = getQueuedAttempts();
  queue.push(attempt);
  saveLocal(QUEUE_KEY, queue);
}

export function removeQueuedAttempt(localId: string): void {
  const queue = getQueuedAttempts().filter((a) => a.localId !== localId);
  saveLocal(QUEUE_KEY, queue);
}

export function queueLength(): number {
  return getQueuedAttempts().length;
}

/**
 * Attempt to sync every queued item in order via `submit`. Stops at the
 * first failure (keeps remaining items queued, in order) rather than
 * reordering or dropping anything.
 */
export async function flushQueue(
  submit: (attempt: QueuedAttempt) => Promise<void>
): Promise<{ synced: number; remaining: number }> {
  const queue = getQueuedAttempts();
  let synced = 0;
  for (const attempt of queue) {
    try {
      await submit(attempt);
      removeQueuedAttempt(attempt.localId);
      synced++;
    } catch {
      break;
    }
  }
  return { synced, remaining: queueLength() };
}
