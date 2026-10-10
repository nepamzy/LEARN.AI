// Phase 7c §1d: the one seeded university course with real structured
// practice content, wired into the same live BKT/FSRS engine Math/English
// use (see LIVE_SUBJECT_IDS in studentId.ts and the Phase 7c migration that
// seeds its questions). Every other university course — seeded or typed —
// has none; this is a pilot proving the architecture extends, not a claim
// of broader coverage.
import { subjects } from "./mockData";

export const PILOT_UNIVERSITY_SUBJECT_ID = "uni-cs-algo";

function pilotSubjectName(): string {
  return subjects.find((s) => s.id === PILOT_UNIVERSITY_SUBJECT_ID)?.name ?? "";
}

/**
 * Matched by course NAME rather than id: a UniversityCourse's id is either a
 * SEED_COURSES id or a freshly generated uuid for a typed course, so the
 * only stable link to the seeded subject is the exact course name — the
 * same name used whether a student picks the seed suggestion or types it
 * out themselves.
 */
export function courseHasStructuredContent(courseName: string): boolean {
  const name = pilotSubjectName();
  return !!name && courseName.trim().toLowerCase() === name.trim().toLowerCase();
}
