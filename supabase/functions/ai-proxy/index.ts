// Server-side proxy for Astra Study's AI features. The browser sends only
// student-facing content; prompts, model choice, and the API key stay here.
// Secret: ANTHROPIC_API_KEY (set with `supabase secrets set`).
// Optional: ALLOWED_ORIGIN (defaults to "*" — tighten before public launch).

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const TUTOR_MODEL = "claude-haiku-4-5-20251001";
const GRADING_MODEL = "claude-sonnet-5-5";

const TUTOR_SYSTEM = `You are Astra, a study tutor for Nigerian secondary-school students preparing for JAMB, WAEC, NECO, Post-UTME, BECE and Common Entrance exams.

Teaching rules:
- For conceptual questions, use short Socratic prompts that help the student reason to the answer.
- For procedural questions (solving equations, balancing reactions), show direct step-by-step working.
- Never give the final answer to an active assignment or mock exam question. Teach the method and ask the student to finish.
- If the student has been wrong several times in this conversation, simplify the explanation and use a concrete example.
- Keep replies under 150 words unless the student asks for more. Use plain English. Never shame the student.
- If asked about something outside school subjects, gently steer back to study.`;

const TONE_INSTRUCTIONS: Record<string, string> = {
  concise: "Tone: concise. Two to three sentences maximum.",
  guided: "Tone: guided. Ask one leading question at a time.",
  visual: "Tone: visual. Use a concrete everyday analogy.",
  "step-by-step": "Tone: step-by-step. Number each step and keep steps short.",
};

const GRADING_SYSTEM = `You are an experienced Nigerian examiner giving rubric-based guidance on a student's written work. This is practice feedback, not an official grade.

Rules:
- Score each rubric criterion from 0 to its maxScore. Use integers.
- Base every score and comment on the student's actual text. Quote short phrases from it in "quotes".
- Be specific: name what was done well and what is missing. No generic praise.
- Respond with ONLY a JSON object, no prose, in this shape:
{"criteria":[{"criterionId":"...","score":0,"feedback":"...","quotes":["..."]}],"strengths":["..."],"improvements":["..."]}`;

const MAX_MESSAGE = 2000;
const MAX_HISTORY_TURNS = 6;
const MAX_TURN_CHARS = 2000;
const MAX_STUDENT_TEXT = 8000;
const MAX_CRITERIA = 10;

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isString(v: unknown, max: number): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= max;
}

async function callAnthropic(model: string, system: { text: string; cache: boolean }[], messages: unknown[], maxTokens: number) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return { error: "not_configured" as const };

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

  if (res.status === 429) return { error: "rate_limited" as const };
  if (!res.ok) return { error: "upstream" as const };

  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  return { text };
}

async function handleTutor(body: Record<string, unknown>) {
  if (!isString(body.message, MAX_MESSAGE)) return json({ error: "invalid_message" }, 400);
  const tone = typeof body.tone === "string" && TONE_INSTRUCTIONS[body.tone] ? body.tone : "guided";

  const history = Array.isArray(body.history)
    ? body.history
        .slice(-MAX_HISTORY_TURNS)
        .filter((t): t is { role: string; content: string } =>
          !!t && typeof t === "object" && isString((t as { content?: unknown }).content, MAX_TURN_CHARS)
        )
        .map((t) => ({ role: t.role === "tutor" ? "assistant" : "user", content: t.content }))
    : [];

  const messages = [...history, { role: "user", content: body.message }];
  const result = await callAnthropic(
    TUTOR_MODEL,
    [
      { text: TUTOR_SYSTEM, cache: true },
      { text: TONE_INSTRUCTIONS[tone], cache: false },
    ],
    messages,
    400
  );
  if ("error" in result) return json({ error: result.error }, result.error === "rate_limited" ? 429 : 502);
  return json({ text: result.text.trim() });
}

async function handleGrade(body: Record<string, unknown>) {
  if (!isString(body.assignmentTitle, 200) || !isString(body.objective, 1000)) return json({ error: "invalid_assignment" }, 400);
  if (!isString(body.studentText, MAX_STUDENT_TEXT)) return json({ error: "invalid_submission" }, 400);
  if (!Array.isArray(body.rubric) || body.rubric.length === 0 || body.rubric.length > MAX_CRITERIA) {
    return json({ error: "invalid_rubric" }, 400);
  }

  const rubric = body.rubric as { id: unknown; name: unknown; maxScore: unknown }[];
  const rubricLines = rubric.map((r) => `- ${String(r.id)} | ${String(r.name)} | max ${String(r.maxScore)}`).join("\n");

  const userPrompt = `Assignment: ${body.assignmentTitle}
Learning objective: ${body.objective}

Rubric (id | criterion | max score):
${rubricLines}

Student's work:
"""
${body.studentText}
"""`;

  const result = await callAnthropic(GRADING_MODEL, [{ text: GRADING_SYSTEM, cache: true }], [{ role: "user", content: userPrompt }], 1200);
  if ("error" in result) return json({ error: result.error }, result.error === "rate_limited" ? 429 : 502);

  const match = result.text.match(/\{[\s\S]*\}/);
  if (!match) return json({ error: "unparseable" }, 502);
  try {
    return json(JSON.parse(match[0]));
  } catch {
    return json({ error: "unparseable" }, 502);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (body.kind === "tutor") return handleTutor(body);
  if (body.kind === "grade") return handleGrade(body);
  return json({ error: "unknown_kind" }, 400);
});
