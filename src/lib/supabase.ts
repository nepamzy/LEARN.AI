import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars missing — live data features will fail. Check .env.");
}

export const supabase = createClient(url ?? "", key ?? "");

// Single seeded demo student for this phase (see supabase/migrations) —
// real multi-user auth is out of scope until Phase 3.
export const DEMO_STUDENT_ID = "00000000-0000-4000-8000-000000000001";

// Subjects whose mastery/revision data is now backed by the real engine.
// Everything else (biology, chemistry, assignments, tutor) still reads
// src/lib/mockData.ts untouched.
export const LIVE_SUBJECT_IDS = ["math", "english"] as const;
export type LiveSubjectId = (typeof LIVE_SUBJECT_IDS)[number];

export function isLiveSubject(subjectId: string): subjectId is LiveSubjectId {
  return (LIVE_SUBJECT_IDS as readonly string[]).includes(subjectId);
}
