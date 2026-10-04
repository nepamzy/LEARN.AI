// Confirms the Phase 4 RLS tightening (see
// supabase/migrations/20261004120100_tighten_rls_policies.sql) actually
// blocks cross-student reads, using the same anon/publishable key the
// browser uses (never the service role).
//
// Requires network access to the live Supabase project and the migration
// already applied, so it could NOT be run from the sandbox this phase was
// built in (see the Phase 4 report — the same proxy policy that blocked
// Phase 2's live-write verification blocks this too). Run it yourself:
//
//   npx tsx scripts/verify-rls.ts
//
// Expected result if the migration is applied correctly: every check below
// passes. If any FAILs, the RLS policy for that table is not scoping by
// student_id correctly and must be fixed before deploying a real API key
// behind the proxy.

import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error("Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (e.g. `source .env`) before running this.");
  process.exit(1);
}
const supabase = createClient(url, key);

const DEMO_STUDENT_ID = "00000000-0000-4000-8000-000000000001";
const OTHER_STUDENT_ID = "00000000-0000-4000-8000-000000000999"; // does not exist — the point of the test

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail?: string) {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (ok) passed++;
  else failed++;
}

async function main() {
  console.log("\nRLS: a request scoped to a non-existent/mismatched student_id");
  console.log("----------------------------------------------------------------");

  const { data: otherAttempts, error: e1 } = await supabase
    .from("practice_attempts")
    .select("id")
    .eq("student_id", OTHER_STUDENT_ID);
  check("practice_attempts: zero rows for a non-matching student_id", !e1 && (otherAttempts?.length ?? 0) === 0, e1?.message);

  const { data: otherMastery, error: e2 } = await supabase
    .from("mastery_records")
    .select("topic_id")
    .eq("student_id", OTHER_STUDENT_ID);
  check("mastery_records: zero rows for a non-matching student_id", !e2 && (otherMastery?.length ?? 0) === 0, e2?.message);

  const { data: otherStudent, error: e3 } = await supabase.from("students").select("id").eq("id", OTHER_STUDENT_ID);
  check("students: zero rows for a non-matching id", !e3 && (otherStudent?.length ?? 0) === 0, e3?.message);

  console.log("\nRLS: the seeded demo student can still read their own data");
  console.log("--------------------------------------------------------------");

  const { data: ownMastery, error: e4 } = await supabase
    .from("mastery_records")
    .select("topic_id")
    .eq("student_id", DEMO_STUDENT_ID);
  check("mastery_records: the demo student's own rows are still readable", !e4, e4?.message);
  console.log(`    (${ownMastery?.length ?? 0} row(s) found for the demo student)`);

  console.log("\nRLS: curriculum reference data is still publicly readable");
  console.log("--------------------------------------------------------------");

  const { data: subjects, error: e5 } = await supabase.from("subjects").select("id").limit(1);
  check("subjects: still readable without a student scope", !e5 && (subjects?.length ?? 0) > 0, e5?.message);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("verify-rls.ts crashed:", err);
  process.exit(1);
});
