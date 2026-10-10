// Confirms RLS actually isolates data between REAL accounts now that
// current_demo_student_id() resolves auth.uid() (see
// supabase/migrations/20261012090000_phase8_real_auth.sql), not just "a
// request scoped to a student_id that doesn't exist" the way this script
// checked before Phase 8 — that older check could pass even with a totally
// broken policy, as long as nobody happened to query the one id that did
// exist. This version signs in as two SEPARATE real test accounts and
// proves account B's own session genuinely cannot read or write account
// A's rows — the actual thing "two real accounts cannot see each other's
// data" (Phase 8 §3 test #1) means.
//
// Requires network access to the live Supabase project (this sandbox could
// not reach it — see the Phase 8 report, same limitation as every prior
// phase's live-write verification). Run it yourself:
//
//   npx tsx scripts/verify-rls.ts
//
// One-time setup this needs in the Supabase dashboard before it can pass:
// disable "Confirm email" under Authentication > Providers > Email (or the
// signUp calls below will succeed but leave the account unconfirmed, with
// no session to sign into) — a test-project-only setting, never apply it
// to a real production project.

import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error("Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (e.g. `source .env`) before running this.");
  process.exit(1);
}

const DEMO_STUDENT_ID = "00000000-0000-4000-8000-000000000001";
const TEST_PASSWORD = "AstraRlsTest!2026";
// Fixed (not randomly generated per run) so repeated runs sign back INTO
// the same two throwaway accounts instead of accumulating new ones.
const EMAIL_A = "astra-rls-test-a@example.com";
const EMAIL_B = "astra-rls-test-b@example.com";

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail?: string) {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (ok) passed++;
  else failed++;
}

function newClient() {
  // persistSession: false — this is a one-shot Node script, not a browser;
  // each client below keeps its OWN in-memory session rather than fighting
  // over shared storage.
  return createClient(url!, key!, { auth: { persistSession: false } });
}

/** Signs into a fixed throwaway test account, creating it on first run. Returns its real auth.uid(). */
async function ensureTestAccount(client: ReturnType<typeof createClient>, email: string): Promise<string> {
  const signIn = await client.auth.signInWithPassword({ email, password: TEST_PASSWORD });
  if (!signIn.error && signIn.data.user) return signIn.data.user.id;

  const signUp = await client.auth.signUp({ email, password: TEST_PASSWORD });
  if (signUp.error) throw new Error(`could not sign in or sign up ${email}: ${signUp.error.message}`);
  if (signUp.data.session && signUp.data.user) return signUp.data.user.id;

  throw new Error(
    `${email} was created but has no session — email confirmation is likely still required for this project; disable it under Authentication > Providers > Email for this TEST project only (see this file's header comment)`
  );
}

async function main() {
  console.log("\nRLS setup: two REAL, separately-authenticated test accounts");
  console.log("------------------------------------------------------------------");
  const clientA = newClient();
  const clientB = newClient();
  const userIdA = await ensureTestAccount(clientA, EMAIL_A);
  const userIdB = await ensureTestAccount(clientB, EMAIL_B);
  check("the two test accounts are genuinely different real users (different auth.uid()s)", userIdA !== userIdB, `A=${userIdA} B=${userIdB}`);

  console.log("\nRLS: account A can read and write its own rows, under its OWN real auth.uid()");
  console.log("-------------------------------------------------------------------------------------");
  const topicId = "rls-probe-topic";
  const { error: upsertErrA } = await clientA.from("mastery_records").upsert({
    student_id: userIdA,
    topic_id: topicId,
    mastery_probability: 0.5,
    status: "building",
    trend: "flat",
    questions_attempted: 1,
    confidence: "low",
    fsrs_stability: 1,
    fsrs_difficulty: 5,
    fsrs_reps: 1,
    fsrs_lapses: 0,
    next_review_due: new Date().toISOString().slice(0, 10),
    updated_at: new Date().toISOString(),
  });
  check("account A can insert a mastery_records row for ITSELF (its own real auth.uid())", !upsertErrA, upsertErrA?.message);

  const { data: ownRowsA, error: readOwnErrA } = await clientA.from("mastery_records").select("topic_id").eq("student_id", userIdA).eq("topic_id", topicId);
  check("account A can read the row back under its own session", !readOwnErrA && (ownRowsA?.length ?? 0) === 1, readOwnErrA?.message);

  console.log("\nRLS: account B's session cannot see or touch account A's data (the real cross-account check)");
  console.log("-----------------------------------------------------------------------------------------------------");
  const { data: crossReadRows, error: crossReadErr } = await clientB.from("mastery_records").select("topic_id").eq("student_id", userIdA).eq("topic_id", topicId);
  check(
    "account B's own session reading WITH account A's id in the filter still gets ZERO rows — RLS, not the filter, is what's actually blocking this",
    !crossReadErr && (crossReadRows?.length ?? 0) === 0,
    crossReadErr?.message
  );

  const crossProbeId = crypto.randomUUID();
  const { error: crossWriteErr } = await clientB.from("graded_submissions").insert({
    id: crossProbeId,
    student_id: userIdA, // B claims to be A
    assignment_id: "rls-probe",
    submission_method: "type",
    submitted_text: "rls cross-account probe",
    total_score: 0,
    max_score: 1,
    criteria: [],
    strengths: [],
    improvements: [],
  });
  const crossWriteRejected = crossWriteErr?.code === "42501";
  check(
    "account B cannot insert a row CLAIMING to be account A — RLS checks the session's real auth.uid(), not the student_id column value B wrote",
    crossWriteRejected,
    crossWriteRejected ? undefined : crossWriteErr ? `not an RLS denial: ${crossWriteErr.message}` : `insert succeeded — remove probe row ${crossProbeId} with the service role`
  );

  const { data: crossUniRows, error: crossUniErr } = await clientB.from("university_assignments").select("id").eq("student_id", userIdA);
  check("account B reading university_assignments filtered to account A's id also gets zero rows", !crossUniErr && (crossUniRows?.length ?? 0) === 0, crossUniErr?.message);

  console.log("\nRLS: the demo account (Phase 8's explicit, labelled fallback — see current_demo_student_id()'s coalesce)");
  console.log("-----------------------------------------------------------------------------------------------------------------");
  // An UNAUTHENTICATED anon-key client (no session at all) — the exact
  // request shape the whole app made before Phase 8, and still makes for
  // "Continue with the demo account". current_demo_student_id() must still
  // resolve this to the fixed demo id, not null/nothing, or the demo
  // account silently loses its own data the moment this migration lands.
  const demoClient = newClient();
  const { data: demoOwnRows, error: demoOwnErr } = await demoClient.from("mastery_records").select("topic_id").eq("student_id", DEMO_STUDENT_ID);
  check("an unauthenticated (anon-key, no session) request can still read the demo account's own rows", !demoOwnErr, demoOwnErr?.message);
  console.log(`    (${demoOwnRows?.length ?? 0} row(s) found for the demo account)`);

  const { data: demoCrossRows, error: demoCrossErr } = await demoClient.from("mastery_records").select("topic_id").eq("student_id", userIdA);
  check(
    "an unauthenticated request can NOT read account A's rows just by filtering for A's id — the demo fallback never leaks into real accounts",
    !demoCrossErr && (demoCrossRows?.length ?? 0) === 0,
    demoCrossErr?.message
  );

  console.log("\nRLS: curriculum reference data is still publicly readable (unauthenticated)");
  console.log("------------------------------------------------------------------------------------");
  const { data: subjectsRows, error: subjectsErr } = await demoClient.from("subjects").select("id").limit(1);
  check("subjects: still readable without any student scope or session", !subjectsErr && (subjectsRows?.length ?? 0) > 0, subjectsErr?.message);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("verify-rls.ts crashed:", err);
  process.exit(1);
});
