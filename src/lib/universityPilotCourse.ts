// Phase 7c/7d: the seeded university courses with real structured practice
// content, wired into the same live BKT/FSRS engine Math/English use (see
// LIVE_SUBJECT_IDS in studentId.ts and the migrations that seed their
// questions). Every other university course — seeded or typed — has none;
// this is a pilot proving the architecture extends, not a claim of broader
// coverage. Phase 7d adds a second entry (Mathematics' Calculus I,
// alongside Phase 7c's Computing pilot, CSC 201) without changing the
// matching mechanism itself.
export interface PilotUniversitySubject {
  subjectId: string;
  courseName: string;
}

export const PILOT_UNIVERSITY_SUBJECTS: PilotUniversitySubject[] = [
  { subjectId: "uni-cs-algo", courseName: "Introduction to Algorithms and Data Structures" },
  { subjectId: "uni-mth-calc1", courseName: "Calculus I" },
];

/** Back-compat alias for the original (Phase 7c) single-pilot constant. */
export const PILOT_UNIVERSITY_SUBJECT_ID = PILOT_UNIVERSITY_SUBJECTS[0].subjectId;

/**
 * Matched by course NAME rather than id: a UniversityCourse's id is either a
 * SEED_COURSES id or a freshly generated uuid for a typed course, so the
 * only stable link to a seeded subject is the exact course name — the same
 * name used whether a student picks the seed suggestion or types it out
 * themselves.
 */
function matchingPilotSubject(courseName: string): PilotUniversitySubject | undefined {
  const name = courseName.trim().toLowerCase();
  if (!name) return undefined;
  return PILOT_UNIVERSITY_SUBJECTS.find((p) => p.courseName.trim().toLowerCase() === name);
}

export function courseHasStructuredContent(courseName: string): boolean {
  return !!matchingPilotSubject(courseName);
}

export function pilotSubjectIdForCourse(courseName: string): string | undefined {
  return matchingPilotSubject(courseName)?.subjectId;
}
