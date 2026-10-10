// The single seeded demo student's identity, split out from supabase.ts so
// it can be imported without pulling in the Supabase client singleton (which
// reads import.meta.env, a Vite-only global). proxyClient.ts needs just the
// id — not a Supabase client — and is itself imported by scripts/verify-ai.ts
// under plain Node via tsx, where import.meta.env does not exist.
//
// Real multi-user auth is out of scope until a later phase — see the Phase 2
// and Phase 4 reports.
export const DEMO_STUDENT_ID = "00000000-0000-4000-8000-000000000001";

// Subjects whose mastery/revision data is backed by the real engine.
// Everything else (biology, chemistry, assignments, tutor) still reads
// src/lib/mockData.ts untouched.
// Phase 7c §1d / Phase 7d §1c: "uni-cs-algo" (CSC 201, Computing) and
// "uni-mth-calc1" (Calculus I, Sciences) are the two pilot university
// courses wired into the same live engine — proof the architecture extends
// past secondary subjects and past a single faculty, not a claim of
// broader university coverage (see the Phase 7c and Phase 7d reports).
// Every other university course has no entry here.
export const LIVE_SUBJECT_IDS = ["math", "english", "uni-cs-algo", "uni-mth-calc1"] as const;
export type LiveSubjectId = (typeof LIVE_SUBJECT_IDS)[number];

export function isLiveSubject(subjectId: string): subjectId is LiveSubjectId {
  return (LIVE_SUBJECT_IDS as readonly string[]).includes(subjectId);
}
