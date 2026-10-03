// Orchestrates one practice attempt through BKT (mastery) + FSRS (scheduling)
// + the mistake classifier, producing the next mastery_records row. Pure
// function of its inputs (no I/O, no Date.now()/impure calls) so it's
// directly unit-testable — see scripts/verify-engine.ts.

import { updateMastery, statusFromProbability, confidenceFromAttempts, trendFromDelta, DEFAULT_BKT_PARAMS } from "./bkt";
import { reviewFsrs, deriveGrade, nextIntervalDays, DEFAULT_FSRS_STATE, type FsrsState } from "./fsrs";
import { classifyMistake, computePriorAccuracy } from "../../features/practice/mistakeClassifier";
import type { MasteryStatus, MistakeType } from "../types";

export interface MasteryRow {
  masteryProbability: number;
  status: MasteryStatus;
  trend: "up" | "down" | "flat";
  questionsAttempted: number;
  confidence: "low" | "medium" | "high";
  fsrs: FsrsState;
  nextReviewDue: string; // ISO date, YYYY-MM-DD
}

export function defaultMasteryRow(today: Date): MasteryRow {
  return {
    masteryProbability: DEFAULT_BKT_PARAMS.prior,
    status: statusFromProbability(DEFAULT_BKT_PARAMS.prior),
    trend: "flat",
    questionsAttempted: 0,
    confidence: "low",
    fsrs: DEFAULT_FSRS_STATE,
    nextReviewDue: toISODate(today),
  };
}

export interface ApplyAttemptInput {
  isCorrect: boolean;
  difficulty: number; // question difficulty, 1-5
  timeSeconds: number;
  priorAttempts: { isCorrect: boolean }[]; // this student's earlier attempts on the SAME topic
  elapsedDaysSinceLastReview: number; // days since fsrs.reps last advanced; 0 for a first review
  now: Date;
}

export interface ApplyAttemptResult {
  row: MasteryRow;
  mistakeType?: MistakeType;
}

export function applyAttempt(prev: MasteryRow | null, input: ApplyAttemptInput): ApplyAttemptResult {
  const current = prev ?? defaultMasteryRow(input.now);

  const priorAccuracy = computePriorAccuracy(input.priorAttempts);
  const mistakeType = input.isCorrect
    ? undefined
    : classifyMistake(input.timeSeconds, priorAccuracy, input.priorAttempts.length);

  const nextP = updateMastery(current.masteryProbability, input.isCorrect, input.difficulty);
  const trend = trendFromDelta(nextP - current.masteryProbability);
  const questionsAttempted = current.questionsAttempted + 1;

  const grade = deriveGrade(input.isCorrect, mistakeType, input.timeSeconds);
  const fsrs = reviewFsrs(current.fsrs, grade, input.elapsedDaysSinceLastReview);
  const intervalDays = nextIntervalDays(fsrs.stability);
  const nextReviewDue = addDays(input.now, intervalDays);

  return {
    row: {
      masteryProbability: nextP,
      status: statusFromProbability(nextP),
      trend,
      questionsAttempted,
      confidence: confidenceFromAttempts(questionsAttempted),
      fsrs,
      nextReviewDue: toISODate(nextReviewDue),
    },
    mistakeType,
  };
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}
