// Pure rate-limiting logic shared between the ai-proxy Edge Function (Deno)
// and scripts/verify-ai.ts (Node, via tsx). Deliberately has no Deno-specific
// globals or imports at module scope so both runtimes can load it directly —
// see the Phase 4 report for why this split exists.

/** Today's UTC calendar date as YYYY-MM-DD — the fixed window's key. */
export function utcWindowDate(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Whether one more request is allowed given the count AFTER incrementing. */
export function isWithinLimit(countAfterIncrement: number, limit: number): boolean {
  return countAfterIncrement <= limit;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidStudentId(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}
