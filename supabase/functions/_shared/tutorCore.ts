// Phase 8 §1c: the tutor system-prompt-building + Anthropic-calling logic,
// pulled out of ai-proxy/index.ts so whatsapp-webhook/index.ts can call the
// EXACT same code path for an inbound WhatsApp message — "reusing the
// existing ai-proxy tutor path rather than a parallel implementation",
// literally: both functions import and call runTutorTurn, there is only
// ever one copy of TEACHING_RULES/the Anthropic call. ai-proxy/index.ts's
// own handleTutor is now a thin HTTP-shaped wrapper around this.
//
// Deno-only (reads Deno.env.get for the API key, same as the original
// callAnthropic did) — unlike rateLimit.ts/levelFraming.ts, this was never
// Node-importable before this refactor either, so nothing that used to be
// testable under scripts/verify-ai.ts stops being so.

import { tutorIntroForLevel } from "../ai-proxy/levelFraming.ts";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
export const TUTOR_MODEL = "claude-haiku-4-5-20251001";
export const GRADING_MODEL = "claude-sonnet-5-5";

// Phase 7: only the opening framing sentence varies by level
// (tutorIntroForLevel) — the teaching rules below are untouched from Phase 3.
export const TEACHING_RULES = `Teaching rules:
- For conceptual questions, use short Socratic prompts that help the student reason to the answer.
- For procedural questions (solving equations, balancing reactions), show direct step-by-step working.
- Never give the final answer to an active assignment or mock exam question. Teach the method and ask the student to finish.
- If the student has been wrong several times in this conversation, simplify the explanation and use a concrete example.
- Keep replies under 150 words unless the student asks for more. Use plain English. Never shame the student.
- If asked about something outside school subjects, gently steer back to study.`;

export function buildTutorSystem(level: unknown, courseName: unknown): string {
  return `${tutorIntroForLevel(level, courseName)}\n\n${TEACHING_RULES}`;
}

export const TONE_INSTRUCTIONS: Record<string, string> = {
  concise: "Tone: concise. Two to three sentences maximum.",
  guided: "Tone: guided. Ask one leading question at a time.",
  visual: "Tone: visual. Use a concrete everyday analogy.",
  "step-by-step": "Tone: step-by-step. Number each step and keep steps short.",
};

export const GRADING_SYSTEM = `You are an experienced Nigerian examiner giving rubric-based guidance on a student's written work. This is practice feedback, not an official grade.

Rules:
- Score each rubric criterion from 0 to its maxScore. Use integers.
- Base every score and comment on the student's actual text. Quote short phrases from it in "quotes".
- Be specific: name what was done well and what is missing. No generic praise.
- Respond with ONLY a JSON object, no prose, in this shape:
{"criteria":[{"criterionId":"...","score":0,"feedback":"...","quotes":["..."]}],"strengths":["..."],"improvements":["..."]}`;

export type AnthropicResult = { text: string } | { error: "not_configured" | "rate_limited" | "upstream" };

export async function callAnthropic(
  model: string,
  system: { text: string; cache: boolean }[],
  messages: unknown[],
  maxTokens: number
): Promise<AnthropicResult> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return { error: "not_configured" };

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: system.map((s) => ({
        type: "text",
        text: s.text,
        ...(s.cache ? { cache_control: { type: "ephemeral" } } : {}),
      })),
      messages,
    }),
  });

  if (res.status === 429) return { error: "rate_limited" };
  if (!res.ok) return { error: "upstream" };

  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  return { text };
}

export interface TutorTurnInput {
  message: string;
  tone?: string;
  history: { role: string; content: string }[];
  level: unknown;
  courseName?: string;
}

/**
 * The one real tutor turn — system prompt, tone, history, and the Anthropic
 * call — called identically by ai-proxy's "tutor" kind (web/app) and by
 * whatsapp-webhook (WhatsApp). Rate limiting and request-shape validation
 * stay with each caller (they differ: ai-proxy validates an HTTP JSON body;
 * whatsapp-webhook validates a WhatsApp Cloud API payload), but the actual
 * teaching logic — what this function does — is the one shared path.
 */
export async function runTutorTurn(input: TutorTurnInput): Promise<AnthropicResult> {
  const tone = input.tone && TONE_INSTRUCTIONS[input.tone] ? input.tone : "guided";
  const messages = [...input.history, { role: "user", content: input.message }];
  return callAnthropic(
    TUTOR_MODEL,
    [
      { text: buildTutorSystem(input.level, input.courseName), cache: true },
      { text: TONE_INSTRUCTIONS[tone], cache: false },
    ],
    messages,
    400
  );
}
