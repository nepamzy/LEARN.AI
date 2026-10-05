// Phase 7: picks the tutor's framing sentence by the student's education
// level, so a Primary-level student never gets JAMB-flavored language even
// incidentally. Deliberately Deno-free (no top-level Deno.env reads, unlike
// index.ts) so scripts/verify-ai.ts can import it directly under plain Node —
// same pattern as rateLimit.ts.
//
// University is not a case here: the client never calls this function for a
// University-level account (TutorPage shows the coming-soon state instead of
// the chat UI — see src/lib/educationLevel.ts), so there is nothing to frame.

export type TutorLevel = "primary" | "junior-secondary" | "senior-secondary";

const DEFAULT_LEVEL: TutorLevel = "senior-secondary";

const LEVEL_INTROS: Record<TutorLevel, string> = {
  primary: "You are Astra, a study tutor for Nigerian primary-school students preparing for the Common Entrance exam.",
  "junior-secondary": "You are Astra, a study tutor for Nigerian junior-secondary students preparing for the BECE.",
  "senior-secondary":
    "You are Astra, a study tutor for Nigerian senior-secondary students preparing for WAEC, NECO, JAMB or Post-UTME exams.",
};

export function isTutorLevel(v: unknown): v is TutorLevel {
  return v === "primary" || v === "junior-secondary" || v === "senior-secondary";
}

/** Falls back to the senior-secondary framing for a missing/invalid level, so an older or malformed request behaves exactly as before this phase. */
export function tutorIntroForLevel(level: unknown): string {
  return LEVEL_INTROS[isTutorLevel(level) ? level : DEFAULT_LEVEL];
}
