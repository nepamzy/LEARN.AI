// Pure conversions between a persisted generated university assignment and
// the row shape university_assignments stores. No Supabase import, so
// scripts/verify-ai.ts can load this under plain Node — same pattern as
// gradedRecord.ts.

import type { GeneratedAssignment, RubricCriterion } from "./types";

export interface PersistedUniversityAssignment extends GeneratedAssignment {
  id: string;
  courseName: string;
  createdAt: string;
}

export interface UniversityAssignmentRow {
  id: string;
  student_id: string;
  course_name: string;
  title: string;
  objective: string;
  instructions: string;
  rubric: RubricCriterion[];
  created_at: string;
}

export function assignmentToRow(a: PersistedUniversityAssignment, studentId: string): UniversityAssignmentRow {
  return {
    id: a.id,
    student_id: studentId,
    course_name: a.courseName,
    title: a.title,
    objective: a.objective,
    instructions: a.instructions,
    rubric: a.rubric,
    created_at: a.createdAt,
  };
}

export function rowToAssignment(row: UniversityAssignmentRow): PersistedUniversityAssignment {
  return {
    id: row.id,
    courseName: row.course_name,
    title: row.title,
    objective: row.objective,
    instructions: row.instructions,
    rubric: row.rubric,
    createdAt: row.created_at,
  };
}
