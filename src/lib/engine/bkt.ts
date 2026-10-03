// Bayesian Knowledge Tracing — the "memory" layer described in the product
// blueprint (Pillar 1). Pure, deterministic, and unit-testable: no I/O here,
// only the math. src/lib/api/liveData.ts is what reads/writes this against
// Supabase.
//
// Standard two-parameter-ish BKT with four knobs:
//   pTransition — chance a student crosses from "not yet mastered" to
//                 "mastered" after a practice opportunity (the learning rate)
//   pGuess      — chance of answering correctly while NOT mastered
//   pSlip       — chance of answering incorrectly while mastered
//   prior       — starting P(mastered) before any evidence (matches the
//                 mastery_records table default of 0.3)
//
// Difficulty weighting (explicitly requested by the brief, and not part of
// "vanilla" BKT): a question's 1-5 difficulty nudges pGuess down and pSlip up
// as it rises, and scales the learning-transition rate on a correct answer.
// The reasoning: a lucky guess is less likely on a harder question (the
// distractors are more plausible), a careless slip is more likely even when
// the student does know the material, and demonstrating mastery on a harder
// item is stronger evidence of real understanding, so it should move the
// estimate further. These are reasonable, clearly-stated modelling choices,
// not calibrated against real exam data — see the Phase 2 note's risk list.

export interface BktParams {
  pTransition: number;
  pGuess: number;
  pSlip: number;
  prior: number;
}

export const DEFAULT_BKT_PARAMS: BktParams = {
  pTransition: 0.15,
  pGuess: 0.22,
  pSlip: 0.1,
  prior: 0.3,
};

function clamp01(x: number): number {
  return Math.min(0.99, Math.max(0.01, x));
}

/** Difficulty (1-5) -> [0,1] scaling factor, 0 at difficulty 1, 1 at difficulty 5. */
function difficultyFactor(difficulty: number): number {
  return (clampDifficulty(difficulty) - 1) / 4;
}

function clampDifficulty(d: number): number {
  return Math.min(5, Math.max(1, d));
}

/**
 * Update P(mastered) given one new observation.
 * Returns the posterior probability after the Bayesian evidence step AND the
 * forward learning-transition step (the standard two-step BKT update).
 */
export function updateMastery(
  priorP: number,
  isCorrect: boolean,
  difficulty: number,
  params: BktParams = DEFAULT_BKT_PARAMS
): number {
  const f = difficultyFactor(difficulty);
  const pGuess = clamp01(params.pGuess * (1 - 0.4 * f)); // harder → guessing right is less likely
  const pSlip = clamp01(params.pSlip * (1 + 0.6 * f)); // harder → slipping is more likely
  const pTransition = clamp01(params.pTransition * (0.7 + 0.6 * f)); // harder correct answer → bigger learning jump

  const p = clamp01(priorP);

  // Step 1: Bayesian update from the observation.
  let posterior: number;
  if (isCorrect) {
    posterior = (p * (1 - pSlip)) / (p * (1 - pSlip) + (1 - p) * pGuess);
  } else {
    posterior = (p * pSlip) / (p * pSlip + (1 - p) * (1 - pGuess));
  }
  posterior = clamp01(posterior);

  // Step 2: forward learning transition (mastery only ever moves toward
  // "learned" here; the evidence step above already pulled it down on a miss).
  const next = posterior + (1 - posterior) * pTransition;
  return clamp01(next);
}

export function statusFromProbability(p: number): "strong" | "building" | "review" | "support" {
  if (p >= 0.82) return "strong";
  if (p >= 0.6) return "building";
  if (p >= 0.4) return "review";
  return "support";
}

export function confidenceFromAttempts(questionsAttempted: number): "low" | "medium" | "high" {
  if (questionsAttempted >= 12) return "high";
  if (questionsAttempted >= 5) return "medium";
  return "low";
}

export function trendFromDelta(delta: number): "up" | "down" | "flat" {
  if (delta > 0.015) return "up";
  if (delta < -0.015) return "down";
  return "flat";
}
