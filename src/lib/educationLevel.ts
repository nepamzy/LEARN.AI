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

// Moved here from onboarding/types.ts in Phase 7c (which re-exports it for
// its own existing imports) so Practice/Progress/Revision/Learn (§1c) can
// filter by level through the exact same mapping ExamStep/SubjectsStep
// already use, without a new onboarding->lib dependency.
export const EXAM_SUBJECTS: Record<ExamType, string[]> = {
  JAMB: ["math", "english", "biology", "chemistry"],
  WAEC: ["math", "english", "biology", "chemistry"],
  NECO: ["math", "english", "biology", "chemistry"],
  "Post-UTME": ["math", "english", "biology", "chemistry"],
  BECE: ["math", "english", "biology"],
  "Common Entrance": ["math", "english"],
};

/**
 * Every subject id reachable by a given education level, via the same
 * EXAM_SUBJECTS mapping ExamStep/SubjectsStep use — unioned across every
 * exam valid for that level (today, every level's exams map to an identical
 * subject list, so this is equivalent to picking any one of them, but it
 * stays correct even if a future exam for the same level covers a different
 * subject set). University has no exams and so no subjects via this path —
 * see §1d for its one, separately-wired pilot course.
 */
export function allowedSubjectIdsForLevel(level: EducationLevel): string[] {
  const subjectIds = new Set<string>();
  for (const exam of allowedExamsForLevel(level)) {
    for (const id of EXAM_SUBJECTS[exam]) subjectIds.add(id);
  }
  return Array.from(subjectIds);
}

/** False only for university — every other level has real exam content today. */
export function hasExamContentForLevel(level: EducationLevel): boolean {
  return allowedExamsForLevel(level).length > 0;
}

/** An onboarding choice (set) overrides the demo student's level; otherwise her level is what the rest of the app reflects. */
export function effectiveEducationLevel(onboardingChoice: EducationLevel | null, studentLevel: EducationLevel): EducationLevel {
  return onboardingChoice ?? studentLevel;
}

// Phase 7c §1a: a university account with zero courses is no longer a
// defensive, unreachable edge case (Profile now lets a student remove every
// course), so Tutor/Assignments need an honest, ACTIONABLE notice here.
// Phase 7's old "University content is coming soon" copy (used here and on
// Practice/Progress/Revision/Learn pre-7b/7c) is retired — it was never true
// once Tutor/Assignments shipped in 7b, and would be even less true now.
export const UNIVERSITY_NO_COURSES = {
  title: "Add a course to get started",
  description: "The tutor and assignments need to know what you're studying. Add at least one course on your profile, then come back here.",
};

// Phase 7c §1c: for Practice/Progress/Revision/Learn specifically — a
// university student who HAS courses, but none of them is the one pilot
// course with real structured content (§1d). Distinct from
// UNIVERSITY_NO_COURSES: the student has a course, there's just no
// practice/mastery data for it yet, so this points at what DOES work today.
export const UNIVERSITY_NO_STRUCTURED_CONTENT = {
  title: "No structured practice for your courses yet",
  description:
    "Astra doesn't have practice questions or tracked mastery for your course(s) yet — that's still a pilot for one course today. The AI Tutor and Assignments already work for any course you name.",
};
