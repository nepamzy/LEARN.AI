// Pure conversions between a saved live grade and the shapes the UI and PDF
// already use. No Supabase import, so scripts/verify-ai.ts can load this under
// plain Node.

import type { Assignment, RubricCriterion as ReportCriterion } from "../types";
import type { GradingResult, SubmissionMethod } from "./types";

export interface GradedRecord {
  id: string;
  assignmentId: string;
  submissionMethod: SubmissionMethod;
  submittedText: string;
  gradedAt: string;
  result: GradingResult;
}

export interface GradedSubmissionRow {
  id: string;
  student_id: string;
  assignment_id: string;
  submission_method: SubmissionMethod;
  submitted_text: string;
  total_score: number;
  max_score: number;
  criteria: GradingResult["criteria"];
  strengths: string[];
  improvements: string[];
  graded_at: string;
}

export function recordToRow(record: GradedRecord, studentId: string): GradedSubmissionRow {
  return {
    id: record.id,
    student_id: studentId,
    assignment_id: record.assignmentId,
    submission_method: record.submissionMethod,
    submitted_text: record.submittedText,
    total_score: record.result.totalScore,
    max_score: record.result.maxScore,
    criteria: record.result.criteria,
    strengths: record.result.strengths,
    improvements: record.result.improvements,
    graded_at: record.gradedAt,
  };
}

export function rowToRecord(row: GradedSubmissionRow): GradedRecord {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    submissionMethod: row.submission_method,
    submittedText: row.submitted_text,
    gradedAt: row.graded_at,
    result: {
      criteria: row.criteria,
      totalScore: row.total_score,
      maxScore: row.max_score,
      strengths: row.strengths,
      improvements: row.improvements,
    },
  };
}

/**
 * Builds the Assignment the report page and PDF render for a live grade.
 * Starts from the mock assignment for its title, objective and rubric, then
 * overlays the scores the AI actually gave. The grading pipeline does not
 * produce next steps or a model answer, so those stay unset and the report
 * omits those sections rather than inventing them.
 */
export function recordToReportAssignment(record: GradedRecord, base: Assignment): Assignment {
  const criteriaById = new Map(record.result.criteria.map((c) => [c.criterionId, c]));
  const rubric: ReportCriterion[] = base.rubric.map((r) => {
    const graded = criteriaById.get(r.id);
    return { ...r, score: graded?.score, feedback: graded?.feedback };
  });

  return {
    ...base,
    status: "returned",
    markedBy: "ai",
    rubric,
    totalScore: record.result.totalScore,
    maxScore: record.result.maxScore,
    submittedAt: record.gradedAt,
    returnedAt: record.gradedAt,
    teacherOverride: undefined,
    strengths: record.result.strengths,
    improvements: record.result.improvements,
    nextSteps: undefined,
    modelAnswerExcerpt: undefined,
  };
}
