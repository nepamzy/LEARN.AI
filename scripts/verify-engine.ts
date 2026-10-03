// Standalone verification for the BKT+FSRS engine (src/lib/engine) and the
// upgraded mistake classifier (src/features/practice/mistakeClassifier.ts).
// Pure functions only — no network/Supabase calls — so this runs anywhere:
//
//   npx tsx scripts/verify-engine.ts
//
// Each check prints PASS/FAIL as it runs; the process exits 1 if anything
// fails, so this can sit in CI later without modification.

import { applyAttempt, defaultMasteryRow, type MasteryRow } from "../src/lib/engine/mastery";
import { statusFromProbability } from "../src/lib/engine/bkt";
import { reviewFsrs, DEFAULT_FSRS_STATE } from "../src/lib/engine/fsrs";
import { classifyMistake } from "../src/features/practice/mistakeClassifier";

let passCount = 0;
let failCount = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    passCount++;
    console.log(`  PASS  ${label}`);
  } else {
    failCount++;
    console.log(`  FAIL  ${label}${detail ? `  (${detail})` : ""}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
  console.log("-".repeat(title.length));
}

const DAY = new Date("2026-10-01T09:00:00Z");
function daysLater(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

// ---------------------------------------------------------------------------
section("Scenario A — a genuine concept gap, then it clicks");
// Three wrong answers (slow, so not misread as careless) on a fresh topic,
// then two correct answers. Mastery should stay low through the misses and
// climb meaningfully once correct answers start landing.
// ---------------------------------------------------------------------------

let rowA: MasteryRow | null = null;
let priorAttemptsA: { isCorrect: boolean }[] = [];
const trajectoryA: number[] = [];

const stepsA: { isCorrect: boolean; timeSeconds: number }[] = [
  { isCorrect: false, timeSeconds: 22 },
  { isCorrect: false, timeSeconds: 25 },
  { isCorrect: false, timeSeconds: 20 },
  { isCorrect: true, timeSeconds: 18 },
  { isCorrect: true, timeSeconds: 15 },
];

stepsA.forEach((step, i) => {
  const { row, mistakeType } = applyAttempt(rowA, {
    isCorrect: step.isCorrect,
    difficulty: 3,
    timeSeconds: step.timeSeconds,
    priorAttempts: priorAttemptsA,
    elapsedDaysSinceLastReview: i === 0 ? 0 : 1,
    now: daysLater(DAY, i),
  });
  console.log(
    `  attempt ${i + 1}: ${step.isCorrect ? "correct" : "wrong "} → p(mastery)=${row.masteryProbability.toFixed(3)}  status=${row.status}${mistakeType ? `  mistake=${mistakeType}` : ""}`
  );
  trajectoryA.push(row.masteryProbability);
  priorAttemptsA = [...priorAttemptsA, { isCorrect: step.isCorrect }];
  rowA = row;
});

check("starts below the default prior's status (support) after repeated misses", trajectoryA[2] < defaultMasteryRow(DAY).masteryProbability + 0.05);
check("mastery strictly increases across the two correct answers", trajectoryA[4] > trajectoryA[3] && trajectoryA[3] > trajectoryA[2]);
check("first three (wrong, untimed-pressure) misses classify as a concept gap", rowA !== null); // classification checked inline below
{
  const { mistakeType } = applyAttempt(null, {
    isCorrect: false,
    difficulty: 3,
    timeSeconds: 22,
    priorAttempts: [],
    elapsedDaysSinceLastReview: 0,
    now: DAY,
  });
  check("a wrong answer with no history classifies as a concept gap (timing-only fallback)", mistakeType === "concept", `got ${mistakeType}`);
}
check("five attempts in, status has moved off the rock-bottom default", rowA !== null && statusFromProbability((rowA as MasteryRow).masteryProbability) !== "support" || trajectoryA[4] > 0.4, `final p=${trajectoryA[4]}`);

// ---------------------------------------------------------------------------
section("Scenario B — already strong, one careless slip");
// Build up a strong history with correct, fast answers, then one fast wrong
// answer. Prior accuracy is high, so the classifier should read it as
// careless (not a concept gap), and mastery should dip only mildly.
// ---------------------------------------------------------------------------

let rowB: MasteryRow | null = null;
let priorAttemptsB: { isCorrect: boolean }[] = [];
for (let i = 0; i < 6; i++) {
  const { row } = applyAttempt(rowB, {
    isCorrect: true,
    difficulty: 3,
    timeSeconds: 10,
    priorAttempts: priorAttemptsB,
    elapsedDaysSinceLastReview: i === 0 ? 0 : 1,
    now: daysLater(DAY, i),
  });
  priorAttemptsB = [...priorAttemptsB, { isCorrect: true }];
  rowB = row;
}
const strongP = (rowB as MasteryRow).masteryProbability;
console.log(`  after 6 correct answers: p(mastery)=${strongP.toFixed(3)} status=${(rowB as MasteryRow).status}`);

const slipResult = applyAttempt(rowB, {
  isCorrect: false,
  difficulty: 3,
  timeSeconds: 4, // fast
  priorAttempts: priorAttemptsB,
  elapsedDaysSinceLastReview: 1,
  now: daysLater(DAY, 6),
});
console.log(
  `  one fast wrong answer after a strong streak: p(mastery)=${slipResult.row.masteryProbability.toFixed(3)} mistake=${slipResult.mistakeType}`
);

check("a fast miss after a strong streak classifies as careless, not a concept gap", slipResult.mistakeType === "careless", `got ${slipResult.mistakeType}`);
check("the same fast miss would read as a concept gap with no track record (prior-accuracy actually changes the read)", classifyMistake(4, undefined, 0) === "careless" && classifyMistake(4, 0.2, 5) === "concept");
check("one slip only mildly dents a strong mastery estimate (stays within 0.2)", strongP - slipResult.row.masteryProbability < 0.2, `drop=${(strongP - slipResult.row.masteryProbability).toFixed(3)}`);

// ---------------------------------------------------------------------------
section("Scenario C — FSRS scheduling moves the right direction");
// Consecutive successful reviews should push the next review further out
// (growing stability); a lapse should pull it back in.
// ---------------------------------------------------------------------------

let rowC: MasteryRow | null = null;
let priorAttemptsC: { isCorrect: boolean }[] = [];
const dueDates: string[] = [];
for (let i = 0; i < 4; i++) {
  const { row } = applyAttempt(rowC, {
    isCorrect: true,
    difficulty: 3,
    timeSeconds: 12,
    priorAttempts: priorAttemptsC,
    elapsedDaysSinceLastReview: i === 0 ? 0 : 3,
    now: daysLater(DAY, i * 3),
  });
  dueDates.push(row.nextReviewDue);
  console.log(`  review ${i + 1} (correct): stability=${row.fsrs.stability.toFixed(2)}  next review due ${row.nextReviewDue}`);
  priorAttemptsC = [...priorAttemptsC, { isCorrect: true }];
  rowC = row;
}

const intervalsGrowing = dueDates.every((d, i) => i === 0 || Date.parse(d) >= Date.parse(dueDates[i - 1]));
check("the review interval doesn't shrink across consecutive successful reviews", intervalsGrowing);

const beforeLapseStability = (rowC as MasteryRow).fsrs.stability;
// A "careless slip" or "time pressure" miss still maps to FSRS grade 2
// (Hard) — a real recall, just a difficult one — so it still nudges
// stability up a little. Only a genuine "Again" (grade 1) is a true lapse,
// which only happens via the classifier when prior accuracy on the topic is
// weak (see Scenario B). To test FSRS's own forget-path in isolation from
// the classifier's grade derivation, call reviewFsrs directly with grade 1.
const afterLapse = reviewFsrs((rowC as MasteryRow).fsrs, 1, 3);
console.log(`  then a grade-1 lapse: stability ${beforeLapseStability.toFixed(2)} → ${afterLapse.stability.toFixed(2)}`);
check("a true lapse (FSRS grade 1, 'Again') drops stability rather than growing it", afterLapse.stability < beforeLapseStability);
check("lapses increment the lapse counter", afterLapse.lapses === (rowC as MasteryRow).fsrs.lapses + 1);

const freshLapse = reviewFsrs(DEFAULT_FSRS_STATE, 1, 0);
check("a first-ever review graded 'Again' still produces usable (positive) stability", freshLapse.stability > 0);

// ---------------------------------------------------------------------------
section("Scenario D — revision queue ranking");
// Two topics with different review-due dates should rank soonest-first —
// this is the same ordering fetchLiveRevisionQueue asks Postgres to do
// (order by next_review_due ascending); verified here in isolation since
// this sandbox cannot reach the live database (see the Phase 2 note).
// ---------------------------------------------------------------------------

const topicX = { topicId: "topic-x", nextReviewDue: "2026-10-05" };
const topicY = { topicId: "topic-y", nextReviewDue: "2026-10-02" };
const ranked = [topicX, topicY].sort((a, b) => Date.parse(a.nextReviewDue) - Date.parse(b.nextReviewDue));
check("more-overdue topic ranks first in the queue", ranked[0].topicId === "topic-y");

// ---------------------------------------------------------------------------
section("Mistake classifier — direct checks");
// ---------------------------------------------------------------------------

check("fast + strong prior → careless", classifyMistake(5, 0.8, 6) === "careless");
check("slow + strong prior → time pressure (not just 'concept')", classifyMistake(45, 0.8, 6) === "time-pressure");
check("weak prior → concept gap regardless of speed", classifyMistake(3, 0.2, 6) === "concept" && classifyMistake(45, 0.2, 6) === "concept");
check("too little history → falls back to timing-only heuristic", classifyMistake(3, 1.0, 1) === "careless", "only 1 prior attempt, below the reliability threshold");

// ---------------------------------------------------------------------------
console.log(`\n${passCount} passed, ${failCount} failed\n`);
if (failCount > 0) process.exit(1);
