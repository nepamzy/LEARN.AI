// A simplified FSRS (Free Spaced Repetition Scheduler) implementation —
// the "schedule" layer from the product blueprint (Pillar 2).
//
// WHAT'S SIMPLIFIED vs. full FSRS (documented explicitly, per the Phase 2
// instructions, rather than silently cutting corners):
//   1. Weights are FSRS-4.5's published defaults, not optimized against this
//      student's own review history (real FSRS optimizes 17 weights per user
//      via gradient descent over thousands of reviews — meaningless for a
//      brand-new demo account with a handful of attempts).
//   2. FSRS expects a true 4-button self-reported grade (Again/Hard/Good/Easy)
//      at review time. Astra Study only collects right/wrong + a derived
//      mistake classification + response time, so `deriveGrade()` below maps
//      that onto FSRS's 1-4 scale as a documented proxy — see its comment.
//   3. Retrievability is computed on demand (from elapsed days + stability)
//      rather than cached, which is fine at this data volume.
//
// The core equations themselves (stability/difficulty update, retrievability,
// next-interval scheduling) are the real FSRS-4.5 formulas, not a toy model.

export type FsrsGrade = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

// FSRS-4.5 default parameter vector (w0..w16).
const W = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61];

const DECAY = -0.5;
const FACTOR = 19 / 81;
const DESIRED_RETENTION = 0.9;

export interface FsrsState {
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
}

export const DEFAULT_FSRS_STATE: FsrsState = { stability: 1, difficulty: 5, reps: 0, lapses: 0 };

function clampDifficulty(d: number): number {
  return Math.min(10, Math.max(1, d));
}

/** Retrievability: probability of recall after `elapsedDays` since the stability `S` was set. */
export function retrievability(elapsedDays: number, stability: number): number {
  if (elapsedDays <= 0) return 1;
  return Math.pow(1 + (FACTOR * elapsedDays) / stability, DECAY);
}

function initialDifficulty(grade: FsrsGrade): number {
  return clampDifficulty(W[4] - Math.exp(W[5] * (grade - 1)) + 1);
}

function nextDifficulty(prevDifficulty: number, grade: FsrsGrade): number {
  const d = prevDifficulty - W[6] * (grade - 3);
  const meanReverted = W[7] * initialDifficulty(4) + (1 - W[7]) * d;
  return clampDifficulty(meanReverted);
}

function nextStabilityOnRecall(stability: number, difficulty: number, r: number, grade: FsrsGrade): number {
  const hardPenalty = grade === 2 ? W[15] : 1;
  const easyBonus = grade === 4 ? W[16] : 1;
  const growth =
    Math.exp(W[8]) * (11 - difficulty) * Math.pow(stability, -W[9]) * (Math.exp((1 - r) * W[10]) - 1) * hardPenalty * easyBonus;
  return stability * (1 + growth);
}

function nextStabilityOnForget(stability: number, difficulty: number, r: number): number {
  return W[11] * Math.pow(difficulty, -W[12]) * (Math.pow(stability + 1, W[13]) - 1) * Math.exp((1 - r) * W[14]);
}

/** Days until retrievability decays to the desired retention target. */
export function nextIntervalDays(stability: number): number {
  const days = (stability / FACTOR) * (Math.pow(DESIRED_RETENTION, 1 / DECAY) - 1);
  return Math.max(1, Math.round(days));
}

/**
 * Advance FSRS state by one review.
 * `elapsedDays` is days since the previous review (0 for a first-ever review).
 */
export function reviewFsrs(state: FsrsState, grade: FsrsGrade, elapsedDays: number): FsrsState {
  const isFirstReview = state.reps === 0;

  if (isFirstReview) {
    return {
      stability: Math.max(0.1, W[grade - 1]),
      difficulty: initialDifficulty(grade),
      reps: 1,
      lapses: grade === 1 ? 1 : 0,
    };
  }

  const r = retrievability(elapsedDays, state.stability);
  const difficulty = nextDifficulty(state.difficulty, grade);
  const stability =
    grade === 1
      ? nextStabilityOnForget(state.stability, state.difficulty, r)
      : nextStabilityOnRecall(state.stability, state.difficulty, r, grade);

  return {
    stability: Math.max(0.1, stability),
    difficulty,
    reps: state.reps + 1,
    lapses: state.lapses + (grade === 1 ? 1 : 0),
  };
}

/**
 * Derive a 1-4 FSRS grade from what Astra Study actually records for a
 * practice attempt, since students answer MCQs rather than self-rating
 * recall quality. This is the documented proxy mentioned above:
 *   - wrong, classified as a genuine concept gap           → 1 (Again)
 *   - wrong, classified as careless or time-pressure        → 2 (Hard —
 *     the method was likely known, so it's a lesser miss than a true gap)
 *   - correct, but slow (at or past `slowThresholdSeconds`) → 3 (Good)
 *   - correct and quick                                     → 4 (Easy)
 */
export function deriveGrade(
  isCorrect: boolean,
  mistakeType: "concept" | "careless" | "time-pressure" | undefined,
  timeSeconds: number,
  slowThresholdSeconds = 25
): FsrsGrade {
  if (!isCorrect) {
    return mistakeType === "concept" ? 1 : 2;
  }
  return timeSeconds >= slowThresholdSeconds ? 3 : 4;
}
