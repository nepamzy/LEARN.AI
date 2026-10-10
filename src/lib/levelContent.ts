// Phase 7c §1c: the one place Practice/Progress/Revision/Learn resolve
// "which subjects can this student actually see" — replacing each page's
// own `subjects.filter(s => amara.subjects.includes(s.id))`, which ignored
// the student's chosen education level entirely.
import { subjects } from "./mockData";
import { allowedSubjectIdsForLevel, UNIVERSITY_NO_COURSES, UNIVERSITY_NO_STRUCTURED_CONTENT } from "./educationLevel";
import { courseHasStructuredContent, pilotSubjectIdForCourse } from "./universityPilotCourse";
import type { EducationLevel, Subject, UniversityCourse } from "./types";

/**
 * Primary/Junior/Senior Secondary: every subject EXAM_SUBJECTS maps to for
 * that level (§1c) — for Senior Secondary this is exactly Amara's own
 * ["math","english","biology","chemistry"], so her experience is unchanged.
 *
 * University: only the pilot subject(s) matching one of the student's named
 * courses by name (§1d — now two: CSC 201 and Calculus I) — otherwise
 * empty, so callers show the honest "no structured content" fallback rather
 * than leaking secondary subjects or a broken empty mastery map.
 */
export function availableSubjectsForLevel(level: EducationLevel, universityCourses: UniversityCourse[] = []): Subject[] {
  if (level === "university") {
    const pilotSubjectIds = new Set(
      universityCourses.map((c) => pilotSubjectIdForCourse(c.name)).filter((id): id is string => !!id)
    );
    return subjects.filter((s) => pilotSubjectIds.has(s.id));
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
