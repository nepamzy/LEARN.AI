// Phase 7: the single, clearly-named place defining which exams (and by
// extension which onboarding/content surfaces) belong to each education
// level. Every level-gated screen imports from here rather than re-deriving
// the mapping locally.

import type { EducationLevel, ExamType } from "./types";

export const EDUCATION_LEVEL_EXAMS: Record<EducationLevel, ExamType[]> = {
  primary: ["Common Entrance"],
  "junior-secondary": ["BECE"],
  "senior-secondary": ["WAEC", "NECO", "JAMB", "Post-UTME"],
  university: [],
};

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  primary: "Primary School",
  "junior-secondary": "Junior Secondary",
  "senior-secondary": "Senior Secondary",
  university: "University / Tertiary",
};

export function allowedExamsForLevel(level: EducationLevel): ExamType[] {
  return EDUCATION_LEVEL_EXAMS[level];
}

/** False only for university — every other level has real exam content today. */
export function hasExamContentForLevel(level: EducationLevel): boolean {
  return allowedExamsForLevel(level).length > 0;
}

/** An onboarding choice (set) overrides the demo student's level; otherwise her level is what the rest of the app reflects. */
export function effectiveEducationLevel(onboardingChoice: EducationLevel | null, studentLevel: EducationLevel): EducationLevel {
  return onboardingChoice ?? studentLevel;
}

// One honest, reused message for every surface that has nothing real to show
// a university-level account yet (§6 — never a silent fallback to secondary
// content). Written once here so the wording stays identical everywhere it
// appears, per surface only the heading context around it differs.
export const UNIVERSITY_COMING_SOON = {
  title: "University content is coming soon",
  description:
    "Astra Study currently supports Primary School through Senior Secondary — Common Entrance, BECE, WAEC, NECO, JAMB and Post-UTME. University-level subjects, tutoring and assignments aren't built yet, but your account is ready for when they are.",
};
