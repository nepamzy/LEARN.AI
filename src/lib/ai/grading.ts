import { callProxy } from "./proxyClient";
import type { CriterionGrade, GradingRequest, GradingResult, RubricCriterion } from "./types";

export function parseGradingResult(raw: unknown, rubric: RubricCriterion[]): GradingResult {
  if (!raw || typeof raw !== "object") throw new Error("Grading response was not an object");
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.criteria)) throw new Error("Grading response has no criteria");

  const byId = new Map(rubric.map((c) => [c.id, c]));
  const criteria: CriterionGrade[] = [];

  for (const item of data.criteria) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    const criterion = byId.get(String(entry.criterionId));
    if (!criterion) continue;
    const rawScore = Number(entry.score);
    if (!Number.isFinite(rawScore)) continue;
    criteria.push({
      criterionId: criterion.id,
      score: Math.min(criterion.maxScore, Math.max(0, Math.round(rawScore))),
      feedback: typeof entry.feedback === "string" ? entry.feedback : "",
      quotes: Array.isArray(entry.quotes) ? entry.quotes.filter((q): q is string => typeof q === "string").slice(0, 3) : [],
    });
  }

  if (criteria.length === 0) throw new Error("Grading response matched no rubric criteria");

  const maxScore = rubric.reduce((sum, c) => sum + c.maxScore, 0);
  const totalScore = criteria.reduce((sum, c) => sum + c.score, 0);
  const strings = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string").slice(0, 5) : []);

  return {
    criteria,
    totalScore,
    maxScore,
    strengths: strings(data.strengths),
    improvements: strings(data.improvements),
  };
}

export async function gradeSubmission(req: GradingRequest): Promise<GradingResult> {
  const raw = await callProxy<unknown>("grade", req);
  return parseGradingResult(raw, req.rubric);
}
