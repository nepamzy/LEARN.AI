// Server-side proxy for Astra Study's AI features. The browser sends only
// student-facing content; prompts, model choice, and the API key stay here.
// Secret: ANTHROPIC_API_KEY (set with `supabase secrets set`).
// Optional: ALLOWED_ORIGIN (defaults to "*" — tighten before public launch).
//
// Phase 4 adds per-student daily rate limiting (see "Rate limiting" below).
// This function is still meant to be deployed with --no-verify-jwt, so
// without this, anyone who obtained the function URL could call it an
// unlimited number of times against the real Anthropic account. Rate
// limiting is the control that makes that deployment mode safe to use.

import { utcWindowDate, isWithinLimit, isValidStudentId } from "./rateLimit.ts";
import { tutorIntroForLevel } from "./levelFraming.ts";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const TUTOR_MODEL = "claude-haiku-4-5-20251001";
const GRADING_MODEL = "claude-sonnet-5-5";

// ---- Rate limiting ---------------------------------------------------------
//
// Limits, per student per calendar day (UTC), as named constants so they're
// trivial to change later:
//   - Tutor is cheap (Haiku, short replies) and used conversationally, so its
//     limit is generous. Note there is ALSO an existing client-side "free
//     tier" limit (DAILY_FREE_MESSAGE_LIMIT = 8 in tutorEngine.ts) that
//     drives the upgrade-prompt UI — that's a separate product/UX concern.
//     This server-side limit is a hard abuse-prevention backstop that holds
//     even if a request bypasses the client entirely (e.g. a direct call to
//     the function URL), so it's set well above the client's UX limit.
//   - Grading is expensive (Sonnet, long output) and a student only submits
//     a handful of assignments a day in normal use, so its limit is tight.
const TUTOR_DAILY_LIMIT = 40;
const GRADING_DAILY_LIMIT = 10;

// Storage: a Postgres table (rate_limit_counters — see
// supabase/migrations/20261004120000_add_rate_limit_counters.sql), written
// via this function's service-role key, which bypasses RLS. Chosen over Deno
// KV because: (1) it's guaranteed to work on Supabase's managed Edge Runtime
// — Deno KV support there is not something this phase could verify without
// a real deployment, which is explicitly out of scope for this session to
// perform; (2) it's inspectable and testable the same way every other table
// in this project is (direct SQL), with no new storage primitive to reason
// about; (3) the existing practice_attempts/mastery_records tables already
// show this schema handles this request volume comfortably.
//
// Window: fixed window (one counter row per student+endpoint+UTC day),
// not a sliding window. A fixed window can let a student send up to 2x the
// limit across a window boundary (e.g. the last message of one day and the
// first of the next), which is an acceptable, well-understood trade-off for
// an abuse backstop at this stage — a sliding window needs either a stored
// timestamp per request or a decaying-bucket algorithm, which is more
// storage and more logic than this phase's threat model (cost control, not
// precise per-second throttling) justifies.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

type RateLimitEndpoint = "tutor" | "grade";

async function checkAndIncrementRateLimit(
  studentId: string,
  endpoint: RateLimitEndpoint,
  limit: number,
  now: Date
): Promise<{ allowed: boolean; count: number }> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    // Misconfigured deployment (missing env vars) — fail closed rather than
    // silently allowing unlimited requests.
    return { allowed: false, count: 0 };
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_rate_limit`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ p_student_id: studentId, p_endpoint: endpoint, p_window_date: utcWindowDate(now) }),
  });
  if (!res.ok) return { allowed: false, count: 0 };
  const count = (await res.json()) as number;
  return { allowed: isWithinLimit(count, limit), count };
}

// Phase 7: only the opening framing sentence varies by level (tutorIntroForLevel,
// from the request's "level" field) — the teaching rules below are untouched
// from Phase 3, per this phase's instruction not to change teaching logic
// beyond what's needed to scope the framing.
const TEACHING_RULES = `Teaching rules:
- For conceptual questions, use short Socratic prompts that help the student reason to the answer.
- For procedural questions (solving equations, balancing reactions), show direct step-by-step working.
- Never give the final answer to an active assignment or mock exam question. Teach the method and ask the student to finish.
- If the student has been wrong several times in this conversation, simplify the explanation and use a concrete example.
- Keep replies under 150 words unless the student asks for more. Use plain English. Never shame the student.
- If asked about something outside school subjects, gently steer back to study.`;

function buildTutorSystem(level: unknown, courseName: unknown): string {
  return `${tutorIntroForLevel(level, courseName)}\n\n${TEACHING_RULES}`;
}

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

const MAX_COURSE_NAME = 200;
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

async function handleTutor(body: Record<string, unknown>, studentId: string) {
  if (!isString(body.message, MAX_MESSAGE)) return json({ error: "invalid_message" }, 400);

  const limit = await checkAndIncrementRateLimit(studentId, "tutor", TUTOR_DAILY_LIMIT, new Date());
  if (!limit.allowed) {
    return json({ error: "daily_limit_reached", endpoint: "tutor", limit: TUTOR_DAILY_LIMIT }, 429);
  }

  const tone = typeof body.tone === "string" && TONE_INSTRUCTIONS[body.tone] ? body.tone : "guided";

  const history = Array.isArray(body.history)
    ? body.history
        .slice(-MAX_HISTORY_TURNS)
        .filter((t): t is { role: string; content: string } =>
          !!t && typeof t === "object" && isString((t as { content?: unknown }).content, MAX_TURN_CHARS)
        )
        .map((t) => ({ role: t.role === "tutor" ? "assistant" : "user", content: t.content }))
    : [];

  const courseName = typeof body.courseName === "string" ? body.courseName.slice(0, MAX_COURSE_NAME) : undefined;
  const messages = [...history, { role: "user", content: body.message }];
  const result = await callAnthropic(
    TUTOR_MODEL,
    [
      { text: buildTutorSystem(body.level, courseName), cache: true },
      { text: TONE_INSTRUCTIONS[tone], cache: false },
    ],
    messages,
    400
  );
  if ("error" in result) return json({ error: result.error }, result.error === "rate_limited" ? 429 : 502);
  return json({ text: result.text.trim() });
}

// Phase 7b: assignments for a university course were never AI-generated
// before this phase — every existing assignment (mockData.ts) is static,
// hand-authored content. This is genuinely new, not a reuse of an existing
// generation path (none existed). Grading the result reuses handleGrade
// unchanged (§6) — this handler only produces the assignment itself.
const ASSIGNMENT_GENERATION_SYSTEM = `You design short practice assignments for Nigerian university students, scoped to one named course. This is practice work, not an official assessment.

Rules:
- Create ONE assignment: a clear title, a one-sentence learning objective, 2-4 sentences of instructions, and a marking rubric of 2-4 criteria whose maxScores sum to a sensible total (e.g. 20 or 40).
- Base the assignment on genuine knowledge of the named course. If the course name is unfamiliar or ambiguous, make a reasonable, honest assumption about what it likely covers and design accordingly — do not refuse and do not ask a clarifying question.
- Respond with ONLY a JSON object, no prose, in this shape:
{"title":"...","objective":"...","instructions":"...","rubric":[{"id":"r1","name":"...","maxScore":10}]}`;

const MAX_GENERATED_CRITERIA = 6;

// Shares the grading rate-limit bucket ("grade", not a new one) — both are
// Sonnet-backed, assignment-lifecycle actions, and the existing table's
// endpoint column is a CHECK constraint over ('tutor','grade'); reusing
// "grade" means no migration is needed for this new capability. Trade-off:
// generating several drafts before submitting any eats into the same daily
// grading allowance — acceptable at this stage, stated in the Phase 7b report.
async function handleGenerateAssignment(body: Record<string, unknown>, studentId: string) {
  if (!isString(body.courseName, MAX_COURSE_NAME)) return json({ error: "invalid_course" }, 400);

  const limit = await checkAndIncrementRateLimit(studentId, "grade", GRADING_DAILY_LIMIT, new Date());
  if (!limit.allowed) {
    return json({ error: "daily_limit_reached", endpoint: "grade", limit: GRADING_DAILY_LIMIT }, 429);
  }

  const userPrompt = `Course: ${body.courseName}\n\nDesign one practice assignment for this course.`;
  const result = await callAnthropic(GRADING_MODEL, [{ text: ASSIGNMENT_GENERATION_SYSTEM, cache: true }], [{ role: "user", content: userPrompt }], 800);
  if ("error" in result) return json({ error: result.error }, result.error === "rate_limited" ? 429 : 502);

  const match = result.text.match(/\{[\s\S]*\}/);
  if (!match) return json({ error: "unparseable" }, 502);
  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    if (Array.isArray(parsed.rubric) && parsed.rubric.length > MAX_GENERATED_CRITERIA) {
      parsed.rubric = parsed.rubric.slice(0, MAX_GENERATED_CRITERIA);
    }
    return json(parsed);
  } catch {
    return json({ error: "unparseable" }, 502);
  }
}

async function handleGrade(body: Record<string, unknown>, studentId: string) {
  if (!isString(body.assignmentTitle, 200) || !isString(body.objective, 1000)) return json({ error: "invalid_assignment" }, 400);
  if (!isString(body.studentText, MAX_STUDENT_TEXT)) return json({ error: "invalid_submission" }, 400);
  if (!Array.isArray(body.rubric) || body.rubric.length === 0 || body.rubric.length > MAX_CRITERIA) {
    return json({ error: "invalid_rubric" }, 400);
  }

  const limit = await checkAndIncrementRateLimit(studentId, "grade", GRADING_DAILY_LIMIT, new Date());
  if (!limit.allowed) {
    return json({ error: "daily_limit_reached", endpoint: "grade", limit: GRADING_DAILY_LIMIT }, 429);
  }

  const rubric = body.rubric as { id: unknown; name: unknown; maxScore: unknown }[];
  const rubricLines = rubric.map((r) => `- ${String(r.id)} | ${String(r.name)} | max ${String(r.maxScore)}`).join("\n");

  // Phase 7b: course context folded into the existing grading prompt, not a
  // second pipeline — GRADING_SYSTEM's rules are unchanged, this just tells
  // the same prompt which course the work is for, when there is one
  // (secondary-level submissions never send this).
  const courseName = typeof body.courseName === "string" ? body.courseName.slice(0, MAX_COURSE_NAME) : undefined;
  const courseLine = courseName ? `Course: ${courseName}\n` : "";

  const userPrompt = `${courseLine}Assignment: ${body.assignmentTitle}
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

  if (!isValidStudentId(body.studentId)) return json({ error: "invalid_student" }, 400);

  if (body.kind === "tutor") return handleTutor(body, body.studentId);
  if (body.kind === "grade") return handleGrade(body, body.studentId);
  if (body.kind === "generate-assignment") return handleGenerateAssignment(body, body.studentId);
  return json({ error: "unknown_kind" }, 400);
});
