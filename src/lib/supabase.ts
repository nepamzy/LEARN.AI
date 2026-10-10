import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars missing — live data features will fail. Check .env.");
}

export const supabase = createClient(url ?? "", key ?? "");

// Re-exported from studentId.ts (not defined here) so modules that need only
// the id/subject constants — not the Supabase client — can import them
// without pulling in import.meta.env. See studentId.ts for why.
export {
  DEMO_STUDENT_ID,
  LIVE_SUBJECT_IDS,
  isLiveSubject,
  getCurrentStudentId,
  setCurrentStudentId,
  type LiveSubjectId,
} from "./studentId";
