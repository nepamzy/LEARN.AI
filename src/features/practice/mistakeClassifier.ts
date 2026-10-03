import type { MistakeType } from "../../lib/types";

// Lightweight heuristic standing in for the real mistake-pattern model:
// very fast wrong answers read as careless slips, very slow ones as time pressure,
// everything else as a genuine concept gap.
export function classifyMistake(timeSeconds: number): MistakeType {
  if (timeSeconds < 8) return "careless";
  if (timeSeconds > 40) return "time-pressure";
  return "concept";
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
