// Network-free checks for the AI layer: canned fallback, grading validation, and proxy gating.
import { generateTutorReply } from "../src/features/tutor/tutorEngine";
import { parseGradingResult } from "../src/lib/ai/grading";
import { isAiConfigured } from "../src/lib/ai/proxyClient";
import type { RubricCriterion } from "../src/lib/ai/types";

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

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
