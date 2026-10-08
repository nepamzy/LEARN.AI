import { callProxy } from "./proxyClient";
import type { GeneratedAssignment, RubricCriterion } from "./types";

const MAX_RUBRIC = 6;

/** Validates and normalizes a generate-assignment response. Pure — mirrors parseGradingResult's defensive style. */
export function parseGeneratedAssignment(raw: unknown): GeneratedAssignment {
  if (!raw || typeof raw !== "object") throw new Error("Generated assignment response was not an object");
  const data = raw as Record<string, unknown>;

  if (typeof data.title !== "string" || !data.title.trim()) throw new Error("Generated assignment has no title");
  if (typeof data.objective !== "string" || !data.objective.trim()) throw new Error("Generated assignment has no objective");
  if (typeof data.instructions !== "string" || !data.instructions.trim()) throw new Error("Generated assignment has no instructions");
  if (!Array.isArray(data.rubric) || data.rubric.length === 0) throw new Error("Generated assignment has no rubric");

  const rubric: RubricCriterion[] = [];
  for (const item of data.rubric.slice(0, MAX_RUBRIC)) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    const maxScore = Number(entry.maxScore);
    if (!Number.isFinite(maxScore) || maxScore <= 0) continue;
    if (typeof entry.name !== "string" || !entry.name.trim()) continue;
    rubric.push({
      id: typeof entry.id === "string" && entry.id.trim() ? entry.id : `r${rubric.length + 1}`,
      name: entry.name,
      maxScore: Math.round(maxScore),
    });
  }
  if (rubric.length === 0) throw new Error("Generated assignment's rubric had no usable criteria");

  return { title: data.title, objective: data.objective, instructions: data.instructions, rubric };
}

export async function generateAssignment(courseName: string): Promise<GeneratedAssignment> {
  const raw = await callProxy<unknown>("generate-assignment", { courseName });
  return parseGeneratedAssignment(raw);
}
