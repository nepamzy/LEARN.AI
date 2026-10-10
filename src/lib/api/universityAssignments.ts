import { supabase, getCurrentStudentId } from "../supabase";
import {
  assignmentToRow,
  rowToAssignment,
  type PersistedUniversityAssignment,
  type UniversityAssignmentRow,
} from "../ai/universityAssignmentRecord";

// Idempotent on the client-generated id, same pattern as saveGradedRecord:
// a retry after a lost response does not create a second row.
export async function saveUniversityAssignment(assignment: PersistedUniversityAssignment): Promise<void> {
  const { error } = await supabase
    .from("university_assignments")
    .upsert(assignmentToRow(assignment, getCurrentStudentId()), { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
}

// Newest assignment first, scoped to one course — a student with multiple
// courses must not have course B's last-generated assignment appear while
// looking at course A.
export async function fetchLatestUniversityAssignment(courseName: string): Promise<PersistedUniversityAssignment | null> {
  const { data, error } = await supabase
    .from("university_assignments")
    .select("*")
    .eq("student_id", getCurrentStudentId())
    .eq("course_name", courseName)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  const rows = (data ?? []) as UniversityAssignmentRow[];
  return rows[0] ? rowToAssignment(rows[0]) : null;
}
