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

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
