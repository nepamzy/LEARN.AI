// Phase 4's per-student daily rate-limit storage, pulled out of
// ai-proxy/index.ts in Phase 8 §1c so whatsapp-webhook/index.ts shares the
// exact same bucket — one real identity now has one tutor-message budget
// per day, not a separate one per channel it happens to message from.
// Deno-only (reads Deno.env.get), same as before this move.

import { utcWindowDate, isWithinLimit } from "../ai-proxy/rateLimit.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export type RateLimitEndpoint = "tutor" | "grade";

// Phase 4 limits, now shared verbatim by ai-proxy/index.ts AND
// whatsapp-webhook/index.ts — one real identity, one daily tutor/grading
// budget, regardless of which channel it messages from.
export const TUTOR_DAILY_LIMIT = 40;
export const GRADING_DAILY_LIMIT = 10;

export async function checkAndIncrementRateLimit(
  studentId: string,
  endpoint: RateLimitEndpoint,
  limit: number,
  now: Date
): Promise<{ allowed: boolean; count: number }> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    // Misconfigured deployment (missing env vars) — fail closed rather than
    // silently allowing unlimited requests.
    return { allowed: false, count: 0 };
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_rate_limit`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ p_student_id: studentId, p_endpoint: endpoint, p_window_date: utcWindowDate(now) }),
  });
  if (!res.ok) return { allowed: false, count: 0 };
  const count = (await res.json()) as number;
  return { allowed: isWithinLimit(count, limit), count };
}
