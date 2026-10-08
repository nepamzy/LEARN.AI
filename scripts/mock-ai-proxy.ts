// Local stand-in for the Supabase ai-proxy Edge Function, for browser testing without
// spending API credit. Same request/response shapes. Test triggers in the message text:
//   "SLOW" -> 6s delay, "FAIL" -> 502 for tutor, "FAILGRADE" -> 502 for grading,
//   "RATELIMIT" -> 429 daily_limit_reached for tutor, "RATELIMITGRADE" -> same for grading.
// The 429 body/status mirrors exactly what the real ai-proxy function returns
// once its Phase 4 rate limit is hit (see supabase/functions/ai-proxy/index.ts),
// so this exercises the real client-side AiRateLimitError path end-to-end.
// Phase 7b: when a tutor request carries courseName (university), the mock
// reply echoes it back verbatim — this is what lets browser-smoke.mjs prove
// end-to-end (not just unit-level) that an arbitrary typed course name
// actually reaches the proxy request body, for a seeded AND a custom course.
import { createServer } from "node:http";

const PORT = 8787;

function send(res: import("node:http").ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });
  res.end(JSON.stringify(body));
}

createServer((req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", async () => {
    const body = JSON.parse(raw || "{}");

    if (body.kind === "tutor") {
      if (String(body.message).includes("RATELIMIT")) return send(res, 429, { error: "daily_limit_reached", endpoint: "tutor", limit: 40 });
      if (String(body.message).includes("SLOW")) await new Promise((r) => setTimeout(r, 6000));
      if (String(body.message).includes("FAIL")) return send(res, 502, { error: "upstream" });
      const courseSuffix = body.courseName ? ` [course: ${body.courseName}]` : "";
      return send(res, 200, {
        text: `Mock tutor (${body.tone}): think about which letter cancels when you add the two equations. What do you get?${courseSuffix}`,
      });
    }

    if (body.kind === "grade") {
      if (String(body.studentText).includes("RATELIMITGRADE")) return send(res, 429, { error: "daily_limit_reached", endpoint: "grade", limit: 10 });
      if (String(body.studentText).includes("FAILGRADE")) return send(res, 502, { error: "upstream" });
      const criteria = (body.rubric as { id: string; maxScore: number }[]).map((r, i) => ({
        criterionId: r.id,
        score: Math.max(0, r.maxScore - 3 - i),
        feedback: `Mock feedback for criterion ${r.id}, based on your text.`,
        quotes: [String(body.studentText).slice(0, 40)],
      }));
      return send(res, 200, {
        criteria,
        strengths: ["Mock strength: clear opening."],
        improvements: ["Mock improvement: add a concrete example."],
      });
    }

    // Phase 7b: mirrors handleGenerateAssignment's real response shape, scoped
    // to whatever course name the client sent — including a non-seeded one.
    if (body.kind === "generate-assignment") {
      const course = String(body.courseName ?? "your course");
      return send(res, 200, {
        title: `Practice assignment: ${course}`,
        objective: `Check understanding of a core concept in ${course}.`,
        instructions: `Write a short response applying a key idea from ${course} to a practical example.`,
        rubric: [
          { id: "r1", name: "Understanding of the concept", maxScore: 10 },
          { id: "r2", name: "Quality of the example", maxScore: 10 },
        ],
      });
    }

    send(res, 400, { error: "unknown_kind" });
  });
}).listen(PORT, () => console.log(`mock AI proxy on http://localhost:${PORT}`));
