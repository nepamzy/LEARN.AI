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
export const LIVE_SUBJECT_IDS = ["math", "english"] as const;
export type LiveSubjectId = (typeof LIVE_SUBJECT_IDS)[number];

export function isLiveSubject(subjectId: string): subjectId is LiveSubjectId {
  return (LIVE_SUBJECT_IDS as readonly string[]).includes(subjectId);
}
