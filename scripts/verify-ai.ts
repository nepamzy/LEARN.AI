// Network-free checks for the AI layer: canned fallback, grading validation, and proxy gating.
// Phase 4 adds: rate-limit decision logic, OCR confidence thresholding, and
// the PDF report's content assembly — all pure functions, so all testable
// here without a deployed Edge Function, a browser, or a real OCR/PDF call.
import { generateTutorReply } from "../src/features/tutor/tutorEngine";
import { parseGradingResult } from "../src/lib/ai/grading";
import { isAiConfigured } from "../src/lib/ai/proxyClient";
import type { RubricCriterion } from "../src/lib/ai/types";
import { utcWindowDate, isWithinLimit, isValidStudentId } from "../supabase/functions/ai-proxy/rateLimit";
import { isLowConfidence, LOW_CONFIDENCE_THRESHOLD } from "../src/lib/ocr/ocrEngine";
import { buildReportSections } from "../src/lib/pdf/assignmentReport";
import type { Assignment } from "../src/lib/types";
import { recordToRow, rowToRecord, recordToReportAssignment, type GradedRecord } from "../src/lib/ai/gradedRecord";
import { assignments } from "../src/lib/mockData";
import { withOcrTimeout, OcrTimeoutError, OcrError, OCR_TIMEOUT_MS } from "../src/lib/ocr/ocrErrors";
import { resumeAction, type PendingGrading } from "../src/lib/ai/gradingQueue";

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean) {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}`);
  if (ok) passed++;
  else failed++;
}

const rubric: RubricCriterion[] = [
  { id: "r1", name: "Content", maxScore: 10 },
  { id: "r2", name: "Organisation", maxScore: 10 },
];

console.log("\nProxy gating");
console.log("------------");
check("no proxy URL configured in this environment", isAiConfigured() === false);

console.log("\nTutor fallback (no proxy)");
console.log("-------------------------");
const reply = await generateTutorReply("Explain simultaneous equations simply", "concise");
check("returns canned reply when no proxy configured", reply.includes("eliminate one variable"));
const reply2 = await generateTutorReply("Quiz me on biology", "guided", [{ role: "student", content: "hi" }]);
check("returns a non-empty reply for an off-topic prompt", reply2.length > 0);

console.log("\nGrading validation");
console.log("------------------");
const good = parseGradingResult(
  {
    criteria: [
      { criterionId: "r1", score: 14, feedback: "Strong", quotes: ["a", "b", "c", "d"] },
      { criterionId: "r2", score: -3, feedback: "Weak" },
      { criterionId: "unknown", score: 5, feedback: "ignored" },
    ],
    strengths: ["clear thesis"],
    improvements: ["add examples"],
  },
  rubric
);
check("clamps scores above maxScore to maxScore", good.criteria[0].score === 10);
check("clamps negative scores to 0", good.criteria[1].score === 0);
check("drops criteria whose id is not in the rubric", good.criteria.length === 2);
check("caps quotes at 3", good.criteria[0].quotes.length === 3);
check("totalScore sums clamped criterion scores", good.totalScore === 10);
check("maxScore comes from the rubric", good.maxScore === 20);

let threw = false;
try {
  parseGradingResult({ criteria: [{ criterionId: "nope", score: 4 }] }, rubric);
} catch {
  threw = true;
}
check("rejects a response that matches no rubric criteria", threw);

threw = false;
try {
  parseGradingResult("not an object", rubric);
} catch {
  threw = true;
}
check("rejects a non-object response", threw);

console.log("\nRate limit decision logic (Phase 4)");
console.log("------------------------------------");
check("utcWindowDate is stable across times on the same UTC day", utcWindowDate(new Date("2026-10-04T00:00:01Z")) === utcWindowDate(new Date("2026-10-04T23:59:59Z")));
check("utcWindowDate changes across a UTC day boundary", utcWindowDate(new Date("2026-10-04T23:59:59Z")) !== utcWindowDate(new Date("2026-10-05T00:00:00Z")));
check("a count at the limit is still allowed (inclusive)", isWithinLimit(40, 40) === true);
check("a count one over the limit is rejected", isWithinLimit(41, 40) === false);
check("a count well under the limit is allowed", isWithinLimit(1, 40) === true);
check("a valid v4-shaped uuid passes studentId validation", isValidStudentId("00000000-0000-4000-8000-000000000001") === true);
check("a non-uuid string fails studentId validation", isValidStudentId("not-a-uuid") === false);
check("an empty/undefined studentId fails validation", isValidStudentId(undefined) === false && isValidStudentId("") === false);

console.log("\nOCR confidence thresholding (Phase 4)");
console.log("--------------------------------------");
check(`a confidence right at the threshold (${LOW_CONFIDENCE_THRESHOLD}) is NOT flagged low`, isLowConfidence(LOW_CONFIDENCE_THRESHOLD) === false);
check("a confidence just below the threshold IS flagged low", isLowConfidence(LOW_CONFIDENCE_THRESHOLD - 1) === true);
check("a high-confidence read is not flagged", isLowConfidence(95) === false);
check("a near-zero-confidence read is flagged", isLowConfidence(2) === true);

console.log("\nPDF report content assembly (Phase 4)");
console.log("--------------------------------------");
const fullAssignment: Assignment = {
  id: "asg-test",
  title: "Class assignment: Ecology — energy flow and food chains",
  subjectId: "biology",
  dueDate: "2026-09-28",
  estimatedMinutes: 30,
  format: "mixed",
  source: "teacher",
  status: "returned",
  objective: "Assess understanding of energy transfer across trophic levels.",
  instructions: "Answer the objective questions, then explain energy loss between trophic levels.",
  rubric: [
    { id: "r1", name: "Objective accuracy", maxScore: 10, score: 9 },
    { id: "r2", name: "Explanation clarity", maxScore: 6, score: 5 },
  ],
  maxScore: 20,
  totalScore: 16,
  teacherOverride: { adjustedScore: 17, comment: "Added a mark back for your diagram.", status: "adjusted" },
  strengths: ["Correctly identified producers and consumers."],
  improvements: ["Be specific about energy loss as heat."],
  nextSteps: ["Revisit the Energy Flow flashcards."],
  modelAnswerExcerpt: "Energy entering an ecosystem is progressively lost as heat.",
};
const sections = buildReportSections(fullAssignment, "Biology");
const flat = sections.map((s) => `${s.heading}\n${s.lines.join("\n")}`).join("\n");
check("includes the assignment title", flat.includes(fullAssignment.title));
check("includes the subject name", flat.includes("Biology"));
check("renders the teacher-adjusted final score, not the AI's raw totalScore", flat.includes("17/20"));
check("includes every rubric criterion's name and score", fullAssignment.rubric.every((r) => flat.includes(`${r.name}: ${r.score}/${r.maxScore}`)));
check("includes the teacher override comment", flat.includes(fullAssignment.teacherOverride!.comment));
check("includes every strength", fullAssignment.strengths!.every((s) => flat.includes(s)));
check("includes every improvement", fullAssignment.improvements!.every((s) => flat.includes(s)));
check("includes every next step", fullAssignment.nextSteps!.every((s) => flat.includes(s)));
check("includes the model-answer excerpt", flat.includes(fullAssignment.modelAnswerExcerpt!));

const minimalAssignment: Assignment = { ...fullAssignment, teacherOverride: undefined, strengths: undefined, improvements: undefined, nextSteps: undefined, modelAnswerExcerpt: undefined };
const minimalSections = buildReportSections(minimalAssignment, undefined);
check("omits optional sections entirely when the assignment has no data for them (no fabricated content)", minimalSections.every((s) => s.heading !== "Strengths" && s.heading !== "Specific improvements" && s.heading !== "What to study next" && s.heading !== "What a stronger answer looks like"));
check("the rubric section is still always present", minimalSections.some((s) => s.heading === "Rubric breakdown"));

console.log("\nLive grade persistence mapping (Phase 5)");
console.log("----------------------------------------");
const liveRecord: GradedRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  assignmentId: "asg-1",
  submissionMethod: "type",
  submittedText: "Qualitative education builds critical thinking.",
  gradedAt: "2026-10-04T12:00:00.000Z",
  result: {
    criteria: [
      { criterionId: "r1", score: 7, feedback: "Clear claim in the opening.", quotes: ["builds critical thinking"] },
      { criterionId: "r2", score: 6, feedback: "Paragraphs follow a logical order.", quotes: [] },
      { criterionId: "ghost", score: 1, feedback: "not in rubric", quotes: [] },
    ],
    totalScore: 13,
    maxScore: 20,
    strengths: ["Clear claim."],
    improvements: ["Add a concrete example."],
  },
};
const demoStudent = "00000000-0000-4000-8000-000000000001";
const row = recordToRow(liveRecord, demoStudent);
check("row carries the student id it was given (not the record's)", row.student_id === demoStudent);
check("row maps totalScore and maxScore to total_score and max_score", row.total_score === 13 && row.max_score === 20);
check("row keeps the submission method and graded timestamp", row.submission_method === "type" && row.graded_at === liveRecord.gradedAt);
check("row round-trips back to the same record", JSON.stringify(rowToRecord(row)) === JSON.stringify(liveRecord));

const mockBase = assignments.find((a) => a.id === "asg-1")!;
const reportAssignment = recordToReportAssignment(liveRecord, mockBase);
check("report assignment is marked returned so the report page renders it", reportAssignment.status === "returned");
check("report assignment is marked as AI-marked, not teacher-marked", reportAssignment.markedBy === "ai");
check("report rubric takes each criterion's live score", reportAssignment.rubric.find((r) => r.id === "r1")?.score === 7);
check("report rubric takes each criterion's live feedback", reportAssignment.rubric.find((r) => r.id === "r2")?.feedback === "Paragraphs follow a logical order.");
check("report keeps the mock rubric's names and maxima", reportAssignment.rubric.every((r, i) => r.name === mockBase.rubric[i].name && r.maxScore === mockBase.rubric[i].maxScore));
check("a criterion absent from the grade stays unscored, not invented", reportAssignment.rubric.find((r) => r.id === "r4")?.score === undefined);
check("report total comes from the live result", reportAssignment.totalScore === 13 && reportAssignment.maxScore === 20);
check("no teacher override is fabricated for a live grade", reportAssignment.teacherOverride === undefined);
check("no next steps are fabricated (grading pipeline doesn't produce them)", reportAssignment.nextSteps === undefined);
check("no model answer is fabricated (grading pipeline doesn't produce it)", reportAssignment.modelAnswerExcerpt === undefined);

const livePdf = buildReportSections(reportAssignment, "English Language");
const livePdfText = livePdf.map((s) => `${s.heading}\n${s.lines.join("\n")}`).join("\n");
check("live PDF labels the mark as an AI practice mark", livePdfText.includes("AI practice mark: 13/20"));
check("live PDF does not present the AI score as a total mark", !livePdfText.includes("Total mark"));
check("live PDF carries the live criterion scores and feedback", livePdfText.includes("Clear claim in the opening."));
check("live PDF omits the next-steps section it has no data for", !livePdf.some((s) => s.heading === "What to study next"));

const mockPdf = buildReportSections(mockBase, "English Language");
const mockPdfText = mockPdf.map((s) => `${s.heading}\n${s.lines.join("\n")}`).join("\n");
check("fallback PDF for unmarked demo content still says Total mark", mockPdfText.includes("Total mark:") && !mockPdfText.includes("AI practice mark"));

console.log("\nOCR time bound (Phase 6)");
console.log("------------------------");
check("the OCR bound is between 20 and 60 seconds", OCR_TIMEOUT_MS >= 20_000 && OCR_TIMEOUT_MS <= 60_000);

let timedOut: unknown = null;
try {
  await withOcrTimeout(new Promise<never>(() => {}), 30);
} catch (err) {
  timedOut = err;
}
check("a task that never settles rejects once the bound passes", timedOut instanceof OcrTimeoutError);
check("the timeout error is an OcrError, so the existing error branch still handles it", timedOut instanceof OcrError);
check("the timeout message tells the student to check their connection and try again", (timedOut as Error).message.includes("Check your connection and try again"));

check("a task that settles within the bound resolves with its value", (await withOcrTimeout(Promise.resolve(42), 50)) === 42);
check(
  "a task slower than the bound is timed out even though it eventually succeeds",
  await withOcrTimeout(new Promise((r) => setTimeout(() => r("late"), 100)), 20).then(() => false, (e) => e instanceof OcrTimeoutError)
);
let ownError: unknown = null;
try {
  await withOcrTimeout(Promise.reject(new OcrError("own failure")), 50);
} catch (err) {
  ownError = err;
}
check("a task's own failure passes through unchanged, not reported as a timeout", (ownError as Error).message === "own failure" && !(ownError instanceof OcrTimeoutError));

console.log("\nResume decision for interrupted submissions (Phase 6)");
console.log("------------------------------------------------------");
const jobBase: Omit<PendingGrading, "submissionMethod" | "result"> = {
  assignmentId: "asg-1",
  request: { assignmentTitle: "t", objective: "o", rubric: [{ id: "r1", name: "n", maxScore: 10 }], studentText: "text" },
  submittedAt: "2026-10-04T12:00:00.000Z",
  recordId: "22222222-2222-4222-8222-222222222222",
};
check("a file job is never auto-resumed, it stays visibly not graded", resumeAction({ ...jobBase, submissionMethod: "file" }) === "file-not-graded");
check(
  "a job that already has a grade only needs its save retried (no AI call)",
  resumeAction({ ...jobBase, submissionMethod: "type", result: { criteria: [], totalScore: 0, maxScore: 10, strengths: [], improvements: [] } }) === "save-only"
);
check("a job with no grade waits for the student, so no paid grading call runs unasked", resumeAction({ ...jobBase, submissionMethod: "photo" }) === "await-user");

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
