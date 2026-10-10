// The single seeded demo student's identity, split out from supabase.ts so
// it can be imported without pulling in the Supabase client singleton (which
// reads import.meta.env, a Vite-only global). proxyClient.ts needs just the
// id — not a Supabase client — and is itself imported by scripts/verify-ai.ts
// under plain Node via tsx, where import.meta.env does not exist.
//
// Phase 8 §1a: real multi-user auth now exists (src/state/AuthContext.tsx) —
// this id is kept as the fixed identity for the explicit "continue with the
// demo account" path (never silently the default; see the Phase 8 report),
// not as the only identity in the app anymore.
export const DEMO_STUDENT_ID = "00000000-0000-4000-8000-000000000001";

// The id every Supabase read/write and ai-proxy call is actually scoped to
// right now: a real signed-in user's auth.uid() once AuthContext sets one,
// or DEMO_STUDENT_ID otherwise. A plain module-level variable (not a React
// context value) on purpose — src/lib/api/*.ts and proxyClient.ts are plain
// functions, not components, and are also imported under plain Node by
// scripts/verify-ai.ts, where a React context cannot be read. AuthContext is
// the only thing that ever calls the setter; everything else only reads.
let currentStudentId: string = DEMO_STUDENT_ID;

export function getCurrentStudentId(): string {
  return currentStudentId;
}

export function setCurrentStudentId(id: string): void {
  currentStudentId = id;
}

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
