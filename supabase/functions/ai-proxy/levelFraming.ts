// Phase 7: picks the tutor's framing sentence by the student's education
// level, so a Primary-level student never gets JAMB-flavored language even
// incidentally. Deliberately Deno-free (no top-level Deno.env reads, unlike
// index.ts) so scripts/verify-ai.ts can import it directly under plain Node —
// same pattern as rateLimit.ts.
//
// Phase 7b: University is now a real case here (it no longer dead-ends at a
// coming-soon notice — see TutorPage.tsx). There is deliberately no seeded
// per-course content: the framing just tells Claude which course the student
// is taking and leaves the actual teaching to the model's own general
// knowledge of the subject — the same way the tutor already handles any
// phrasing of a secondary-school question without a pre-written answer for
// it. This is the entire mechanism that makes "any course" literally true.

export type TutorLevel = "primary" | "junior-secondary" | "senior-secondary" | "university";

const DEFAULT_LEVEL: TutorLevel = "senior-secondary";

const SECONDARY_INTROS: Record<Exclude<TutorLevel, "university">, string> = {
  primary: "You are Astra, a study tutor for Nigerian primary-school students preparing for the Common Entrance exam.",
  "junior-secondary": "You are Astra, a study tutor for Nigerian junior-secondary students preparing for the BECE.",
  "senior-secondary":
    "You are Astra, a study tutor for Nigerian senior-secondary students preparing for WAEC, NECO, JAMB or Post-UTME exams.",
};

// Used only if a university request somehow arrives with no course name at
// all (shouldn't happen — TutorPage requires a course before it sends a
// message — but this must never silently fall back to secondary framing).
const GENERIC_UNIVERSITY_INTRO =
  "You are Astra, a study tutor for a Nigerian university student. Help with whatever course or topic they ask about, drawing on your own general knowledge of the subject — Astra has no pre-built curriculum for university courses, the same way it has no pre-written answer for any specific secondary-school question either.";

export function isTutorLevel(v: unknown): v is TutorLevel {
  return v === "primary" || v === "junior-secondary" || v === "senior-secondary" || v === "university";
}

/**
 * Falls back to the senior-secondary framing for a missing/invalid level
 * (so an older or malformed request behaves exactly as before this phase),
 * and to a generic university framing for university with no course name.
 * For a real university request, the student's actual course name is
 * interpolated verbatim — this is what the Phase 7b custom-course test
 * confirms directly, string for string.
 */
export function tutorIntroForLevel(level: unknown, courseName?: unknown): string {
  const resolvedLevel = isTutorLevel(level) ? level : DEFAULT_LEVEL;
  if (resolvedLevel !== "university") return SECONDARY_INTROS[resolvedLevel];

  const course = typeof courseName === "string" ? courseName.trim() : "";
  if (!course) return GENERIC_UNIVERSITY_INTRO;
  return `You are Astra, a study tutor for a Nigerian university student currently taking ${course}. Astra has no pre-built curriculum for this course — use your own knowledge of the subject to help, the same way you would for any course the student names.`;
}
