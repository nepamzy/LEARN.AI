// Phase 8 §1a: closes a real gap the Phase 4 design left open on purpose
// (there was only ever one demo student, so nothing to spoof). Now that
// real accounts exist, a studentId in the request body is a CLAIM, not an
// identity — this function is the one place that claim gets checked
// against something the caller cannot forge: a real Supabase Auth JWT.
//
// DEMO_STUDENT_ID is mirrored here (not imported from src/lib/studentId.ts
// — a browser/Vite module, unreachable from Deno) rather than threaded in
// as a parameter, so this stays a plain, two-argument check for the one
// thing it decides.
export const DEMO_STUDENT_ID = "00000000-0000-4000-8000-000000000001";

/**
 * Pure decision, split out from the network call below so it's directly
 * testable under plain Node (scripts/verify-ai.ts) without faking a
 * Supabase Auth HTTP response.
 * - The demo account never needs a token — it has no real session to carry
 *   one, and this is the explicitly-labelled fallback identity (see the
 *   Phase 8 report), not a loophole.
 * - Any OTHER claimed studentId must be backed by a token whose OWN
 *   verified user id matches it exactly.
 */
export function identityMatches(claimedStudentId: string, verifiedUserId: string | null): boolean {
  if (claimedStudentId === DEMO_STUDENT_ID) return true;
  return verifiedUserId !== null && verifiedUserId === claimedStudentId;
}

// Read lazily, inside the function, not at module top level — this module
// is imported by scripts/verify-ai.ts under plain Node (to test
// identityMatches, the pure half of this file) where the Deno global does
// not exist; a top-level Deno.env.get would throw on import, same reason
// rateLimit.ts/levelFraming.ts have always avoided it since Phase 4.
/** Calls Supabase Auth's own /auth/v1/user to verify a bearer token and recover its user id. Returns null for no/invalid/expired token. */
async function verifiedUserIdFromToken(authHeader: string | null): Promise<string | null> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!authHeader?.startsWith("Bearer ") || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { authorization: authHeader, apikey: SUPABASE_ANON_KEY },
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { id?: string };
    return typeof user.id === "string" ? user.id : null;
  } catch {
    return null;
  }
}

/** True once the claimed studentId is either the demo id, or backed by a verified token for that exact user. */
export async function verifyCallerIdentity(req: Request, claimedStudentId: string): Promise<boolean> {
  if (claimedStudentId === DEMO_STUDENT_ID) return true;
  const verifiedUserId = await verifiedUserIdFromToken(req.headers.get("authorization"));
  return identityMatches(claimedStudentId, verifiedUserId);
}
