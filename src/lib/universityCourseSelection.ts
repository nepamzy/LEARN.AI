import type { UniversityCourse } from "./types";

// Phase 7c §1a: the one place TutorPage (and anything else with an "active
// course" selector) decides which course is active. Extracted as a pure
// function so removing a course can be unit-tested directly: it must never
// resolve to a course that isn't in the current list (no stale reference to
// something just removed), falling back to the first remaining course, or
// undefined if none remain.
export function resolveActiveCourse(courses: UniversityCourse[], activeId: string | undefined): UniversityCourse | undefined {
  return courses.find((c) => c.id === activeId) ?? courses[0];
}
