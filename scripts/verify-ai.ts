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
import { assignments, amara } from "../src/lib/mockData";
import { withOcrTimeout, OcrTimeoutError, OcrError, OCR_TIMEOUT_MS } from "../src/lib/ocr/ocrErrors";
import { resumeAction, type PendingGrading } from "../src/lib/ai/gradingQueue";
import {
  EDUCATION_LEVEL_EXAMS,
  allowedExamsForLevel,
  hasExamContentForLevel,
  effectiveEducationLevel,
} from "../src/lib/educationLevel";
import type { EducationLevel } from "../src/lib/types";
import { isTutorLevel, tutorIntroForLevel } from "../supabase/functions/ai-proxy/levelFraming";
import { SEED_COURSES } from "../src/lib/universityCourses";
import { parseGeneratedAssignment } from "../src/lib/ai/assignmentGeneration";

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

console.log("\nEducation level → exam mapping (Phase 7)");
console.log("-------------------------------------------");
check("primary maps to exactly Common Entrance", JSON.stringify(allowedExamsForLevel("primary")) === JSON.stringify(["Common Entrance"]));
check("junior-secondary maps to exactly BECE", JSON.stringify(allowedExamsForLevel("junior-secondary")) === JSON.stringify(["BECE"]));
check(
  "senior-secondary maps to exactly WAEC, NECO, JAMB, Post-UTME",
  JSON.stringify(allowedExamsForLevel("senior-secondary")) === JSON.stringify(["WAEC", "NECO", "JAMB", "Post-UTME"])
);
check("university maps to no exams at all", allowedExamsForLevel("university").length === 0);
check("every level is covered by the mapping, none left implicit", Object.keys(EDUCATION_LEVEL_EXAMS).sort().join(",") === "junior-secondary,primary,senior-secondary,university");

check("primary has real exam content", hasExamContentForLevel("primary") === true);
check("junior-secondary has real exam content", hasExamContentForLevel("junior-secondary") === true);
check("senior-secondary has real exam content", hasExamContentForLevel("senior-secondary") === true);
check("university has no real exam content yet — the honest case", hasExamContentForLevel("university") === false);

check("an onboarding choice overrides the demo student's level", effectiveEducationLevel("primary", "senior-secondary") === "primary");
check("no onboarding choice (null) falls back to the demo student's level", effectiveEducationLevel(null, "senior-secondary") === "senior-secondary");

console.log("\nTutor framing by level, cross-contamination check (Phase 7, updated 7b)");
console.log("---------------------------------------------------------------");
// Phase 7b makes "university" a real, fourth TutorLevel (it previously fell
// back to senior-secondary framing because the tutor was never called for a
// university student at all). These three assertions are updated — not
// dropped — to reflect that deliberate change; everything else here is
// unchanged from Phase 7.
const introByLevel: Record<EducationLevel, string> = {
  primary: tutorIntroForLevel("primary"),
  "junior-secondary": tutorIntroForLevel("junior-secondary"),
  "senior-secondary": tutorIntroForLevel("senior-secondary"),
  university: tutorIntroForLevel("university"),
};
const invalidIntro = tutorIntroForLevel(undefined);
check("primary framing names Common Entrance, never a senior exam", introByLevel.primary.includes("Common Entrance") && !/JAMB|WAEC|NECO|Post-UTME|BECE/.test(introByLevel.primary));
check("junior-secondary framing names BECE, never a senior or primary exam", introByLevel["junior-secondary"].includes("BECE") && !/JAMB|WAEC|NECO|Post-UTME|Common Entrance/.test(introByLevel["junior-secondary"]));
check(
  "senior-secondary framing names the four senior exams, never BECE or Common Entrance",
  ["JAMB", "WAEC", "NECO", "Post-UTME"].every((e) => introByLevel["senior-secondary"].includes(e)) &&
    !/BECE|Common Entrance/.test(introByLevel["senior-secondary"])
);
check(
  "university framing (no course given) is its own generic intro, never falls back to senior-secondary or any secondary exam",
  introByLevel.university !== introByLevel["senior-secondary"] && !/JAMB|WAEC|NECO|Post-UTME|BECE|Common Entrance/.test(introByLevel.university)
);
check("a missing level still falls back to senior-secondary, so an older client behaves exactly as before Phase 7", invalidIntro === introByLevel["senior-secondary"]);
check("a genuinely unrecognized level string also falls back to senior-secondary", tutorIntroForLevel("made-up-level") === introByLevel["senior-secondary"]);
check("isTutorLevel now accepts 'university' — Phase 7b gives it a real tutor path", isTutorLevel("university") === true);
check("isTutorLevel accepts all four real tutor levels", ["primary", "junior-secondary", "senior-secondary", "university"].every((l) => isTutorLevel(l)));

console.log("\nDemo student under the new model (Phase 7)");
console.log("-----------------------------------------------");
check("Amara maps to senior-secondary", amara.educationLevel === "senior-secondary");
check("Amara's existing exam (JAMB) is valid for her mapped level", allowedExamsForLevel(amara.educationLevel).includes(amara.exam));

console.log("\nAssignment content gating (Phase 7)");
console.log("----------------------------------------");
check(
  "the existing JAMB/WAEC-naming assignment is real content, confirming why non-senior levels must not see it unfiltered",
  assignments.some((a) => /JAMB|WAEC/.test(a.objective))
);

console.log("\nUniversity course framing — the any-course mechanism (Phase 7b, §7 test #3)");
console.log("-----------------------------------------------------------------------------");
// This is the single most important check in Phase 7b: the exact course name
// string, verbatim, for a SEEDED course and for a CUSTOM/non-seeded course the
// student typed themselves — quoted here, not just pass/fail, per the task's
// explicit instruction not to claim "any course works" without this evidence.
const seededCourse = SEED_COURSES.find((c) => c.id === "mee-fluids")!; // "Fluid Mechanics" — deliberately not CS/Accounting, to avoid cherry-picking the most common example
const customCourseName = "Entomology and Pest Management"; // a real, deliberately uncommon Nigerian university course, not seeded anywhere in SEED_COURSES
const seededIntro = tutorIntroForLevel("university", seededCourse.name);
const customIntro = tutorIntroForLevel("university", customCourseName);
console.log(`  seeded course name sent:  "${seededCourse.name}"`);
console.log(`  seeded course framing:    "${seededIntro}"`);
console.log(`  custom course name sent:  "${customCourseName}"`);
console.log(`  custom course framing:    "${customIntro}"`);
check("the exact seeded course name string appears verbatim in the tutor system prompt", seededIntro.includes(seededCourse.name));
check("the exact custom/non-seeded course name string appears verbatim in the tutor system prompt", customIntro.includes(customCourseName));
check(
  "seeded and custom courses produce structurally identical framing (same sentence shape, only the course name differs) — nothing marks the custom one as second-class",
  seededIntro.replace(seededCourse.name, "<COURSE>") === customIntro.replace(customCourseName, "<COURSE>")
);
check("university framing (seeded course) never names a secondary exam", !/JAMB|WAEC|NECO|BECE|Common Entrance/.test(seededIntro));
check("university framing (custom course) never names a secondary exam", !/JAMB|WAEC|NECO|BECE|Common Entrance/.test(customIntro));
check("SEED_COURSES is modest and explicitly partial, not a large hand-authored catalog (§8)", SEED_COURSES.length > 0 && SEED_COURSES.length < 30);
check("SEED_COURSES spans more than one faculty, so it's not a single-subject sample", new Set(SEED_COURSES.map((c) => c.faculty)).size >= 4);

console.log("\nGenerated assignment validation (Phase 7b)");
console.log("---------------------------------------------");
const validGenerated = parseGeneratedAssignment({
  title: "Fluid Mechanics: Bernoulli's Principle Problem Set",
  objective: "Apply Bernoulli's equation to practical flow scenarios.",
  instructions: "Solve the three flow problems below, showing all working.",
  rubric: [
    { id: "r1", name: "Correct setup of Bernoulli's equation", maxScore: 10 },
    { id: "r2", name: "Correct final answers", maxScore: 10 },
    { maxScore: 5, name: "Clarity of working (no id given)" },
  ],
});
check("parses a well-formed generated assignment", validGenerated.title.includes("Bernoulli"));
check("keeps every valid rubric criterion", validGenerated.rubric.length === 3);
check("assigns a stable id to a criterion the model didn't give one", validGenerated.rubric[2].id === "r3");
check("rounds a non-integer maxScore", (() => {
  const r = parseGeneratedAssignment({ title: "t", objective: "o", instructions: "i", rubric: [{ id: "r1", name: "n", maxScore: 7.6 }] });
  return r.rubric[0].maxScore === 8;
})());

threw = false;
try {
  parseGeneratedAssignment({ title: "", objective: "o", instructions: "i", rubric: [{ id: "r1", name: "n", maxScore: 10 }] });
} catch {
  threw = true;
}
check("rejects a generated assignment with no title", threw);

threw = false;
try {
  parseGeneratedAssignment({ title: "t", objective: "o", instructions: "i", rubric: [{ id: "r1", name: "n", maxScore: -5 }, { id: "r2", name: "", maxScore: 10 }] });
} catch {
  threw = true;
}
check("rejects a generated assignment whose every rubric criterion is invalid (negative score, empty name)", threw);

threw = false;
try {
  parseGeneratedAssignment("not an object");
} catch {
  threw = true;
}
check("rejects a non-object generated-assignment response", threw);

const oversizedRubric = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, name: `Criterion ${i}`, maxScore: 10 }));
const cappedGenerated = parseGeneratedAssignment({ title: "t", objective: "o", instructions: "i", rubric: oversizedRubric });
check("caps an oversized rubric at 6 criteria", cappedGenerated.rubric.length === 6);

console.log("\nUniversity symmetry — no leakage either direction (Phase 7b, §7 tests #4/#8)");
console.log("--------------------------------------------------------------------------------");
check(
  "no secondary level's framing ever mentions 'course' the way university framing does (no cross-contamination of the new mechanism)",
  [introByLevel.primary, introByLevel["junior-secondary"], introByLevel["senior-secondary"]].every((intro) => !intro.includes(seededCourse.name))
);
check(
  "university framing is the only one of the four that changes based on a courseName argument",
  tutorIntroForLevel("primary", seededCourse.name) === introByLevel.primary &&
    tutorIntroForLevel("junior-secondary", seededCourse.name) === introByLevel["junior-secondary"] &&
    tutorIntroForLevel("senior-secondary", seededCourse.name) === introByLevel["senior-secondary"]
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
