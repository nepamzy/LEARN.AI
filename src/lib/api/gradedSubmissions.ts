import { supabase, DEMO_STUDENT_ID } from "../supabase";
import { recordToRow, rowToRecord, type GradedRecord, type GradedSubmissionRow } from "../ai/gradedRecord";

// Idempotent on the client-generated id: a retry after a lost response does
// not create a second row for the same grade.
export async function saveGradedRecord(record: GradedRecord): Promise<void> {
  const { error } = await supabase
    .from("graded_submissions")
    .upsert(recordToRow(record, DEMO_STUDENT_ID), { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
}

// Newest grade first. Uses a plain select (not maybeSingle) so an empty result is an
// empty array on every PostgREST version.
export async function fetchLatestGradedRecord(assignmentId: string): Promise<GradedRecord | null> {
  const { data, error } = await supabase
    .from("graded_submissions")
    .select("*")
    .eq("student_id", DEMO_STUDENT_ID)
    .eq("assignment_id", assignmentId)
    .order("graded_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  const rows = (data ?? []) as GradedSubmissionRow[];
  return rows[0] ? rowToRecord(rows[0]) : null;
}
