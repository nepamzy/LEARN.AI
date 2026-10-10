// Phase 7c §1c: the one place Practice/Progress/Revision/Learn resolve
// "which subjects can this student actually see" — replacing each page's
// own `subjects.filter(s => amara.subjects.includes(s.id))`, which ignored
// the student's chosen education level entirely.
import { subjects } from "./mockData";
import { allowedSubjectIdsForLevel, UNIVERSITY_NO_COURSES, UNIVERSITY_NO_STRUCTURED_CONTENT } from "./educationLevel";
import { PILOT_UNIVERSITY_SUBJECT_ID, courseHasStructuredContent } from "./universityPilotCourse";
import type { EducationLevel, Subject, UniversityCourse } from "./types";

/**
 * Primary/Junior/Senior Secondary: every subject EXAM_SUBJECTS maps to for
 * that level (§1c) — for Senior Secondary this is exactly Amara's own
 * ["math","english","biology","chemistry"], so her experience is unchanged.
 *
 * University: just the one pilot subject (§1d), and only if one of the
 * student's named courses actually matches it by name — otherwise empty,
 * so callers show the honest "no structured content" fallback rather than
 * leaking secondary subjects or a broken empty mastery map.
 */
export function availableSubjectsForLevel(level: EducationLevel, universityCourses: UniversityCourse[] = []): Subject[] {
  if (level === "university") {
    const hasPilotCourse = universityCourses.some((c) => courseHasStructuredContent(c.name));
    return hasPilotCourse ? subjects.filter((s) => s.id === PILOT_UNIVERSITY_SUBJECT_ID) : [];
  }
  const allowedIds = new Set(allowedSubjectIdsForLevel(level));
  return subjects.filter((s) => allowedIds.has(s.id));
}

/**
 * For Practice/Progress/Revision/Learn: the honest notice to show a
 * university student instead of real content, or null when they have real
 * content to show (the pilot course) and the page should render normally.
 * Primary/Junior/Senior Secondary never need this — their subject lists are
 * never empty (every level has at least one allowed exam/subject today).
 */
export function universityContentGateNotice(universityCourses: UniversityCourse[]): { title: string; description: string } | null {
  if (universityCourses.length === 0) return UNIVERSITY_NO_COURSES;
  const hasPilotCourse = universityCourses.some((c) => courseHasStructuredContent(c.name));
  return hasPilotCourse ? null : UNIVERSITY_NO_STRUCTURED_CONTENT;
}
