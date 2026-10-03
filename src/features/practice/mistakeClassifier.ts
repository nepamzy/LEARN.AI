import type { MistakeType } from "../../lib/types";

const FAST_SECONDS = 8;
const SLOW_SECONDS = 40;
const STRONG_PRIOR = 0.7;
const WEAK_PRIOR = 0.4;
const MIN_ATTEMPTS_FOR_PRIOR = 3;

/**
 * Classify a wrong answer into concept gap / careless slip / time pressure.
 *
 * Response time alone is a weak signal on its own — a fast wrong answer could
 * be a slip (if the student usually gets this topic right) or a guess born of
 * genuinely not knowing where to start (if they usually get it wrong). So the
 * student's own prior accuracy on that specific topic is factored in first,
 * and only used to adjust — not override — the timing read:
 *   - Strong history on this topic (>= 70% correct, with enough attempts to
 *     mean something): a fast miss reads as careless (they know this,
 *     they slipped); a slow miss reads as time pressure (they know it, but
 *     ran out of time/steam) rather than defaulting either to "concept gap".
 *   - Weak history (< 40% correct): read as a concept gap regardless of
 *     speed — a fast wrong answer here is more likely an unconfident guess
 *     than a careless slip, since there's little evidence they know the
 *     method to slip on in the first place.
 *   - No reliable history yet, or accuracy in between: fall back to the
 *     original timing-only heuristic (very fast = careless, very slow =
 *     time pressure, otherwise concept gap).
 *
 * `priorAccuracy` is this student's correct-answer rate on the SAME topic
 * from attempts before this one (0-1), and `priorAttemptCount` how many of
 * those attempts there were — undefined/low counts fall back to timing only.
 */
export function classifyMistake(
  timeSeconds: number,
  priorAccuracy?: number,
  priorAttemptCount = 0
): MistakeType {
  const hasReliablePrior = priorAccuracy !== undefined && priorAttemptCount >= MIN_ATTEMPTS_FOR_PRIOR;

  if (hasReliablePrior && priorAccuracy >= STRONG_PRIOR) {
    return timeSeconds >= SLOW_SECONDS ? "time-pressure" : "careless";
  }

  if (hasReliablePrior && priorAccuracy < WEAK_PRIOR) {
    return "concept";
  }

  if (timeSeconds < FAST_SECONDS) return "careless";
  if (timeSeconds > SLOW_SECONDS) return "time-pressure";
  return "concept";
}

/** Correct-answer rate (0-1) from a topic's attempt history, or undefined with none. */
export function computePriorAccuracy(priorAttempts: { isCorrect: boolean }[]): number | undefined {
  if (priorAttempts.length === 0) return undefined;
  const correct = priorAttempts.filter((a) => a.isCorrect).length;
  return correct / priorAttempts.length;
}

export const mistakeLabel: Record<MistakeType, string> = {
  concept: "Concept gap",
  careless: "Careless slip",
  "time-pressure": "Time pressure",
};

export const mistakeAdvice: Record<MistakeType, string> = {
  concept: "This points to a gap in the method itself — worth reviewing the worked example below.",
  careless: "You likely know this — slow down slightly and re-read the question before answering.",
  "time-pressure": "You may know this better untimed — try a few more of these without the clock this week.",
};
