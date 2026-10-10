// Phase 8 §1c: a WhatsApp entry point to the tutor, reusing the EXACT same
// teaching logic ai-proxy's "tutor" kind uses (../_shared/tutorCore.ts) —
// not a parallel implementation. What WhatsApp's medium genuinely changes,
// stated plainly:
//   - No rich UI: no tone selector, no course switcher, no typing
//     indicator. Replies are plain text only.
//   - Message-based turn-taking, STATELESS between messages: unlike the web
//     tutor (which keeps the whole visible thread as conversational
//     history), this function sends no prior turns to the model — each
//     WhatsApp message is its own fresh question. A real launch wanting
//     continuity would need a small conversation-history table keyed by
//     whatsapp_phone; explicitly out of scope for this phase (see the
//     Phase 8 report).
//   - Course context for a university student: there is no switcher to
//     tap, so this always uses the student's FIRST added course (the same
//     "defaults to the first added" rule TutorPage already documents for
//     its own switcher — see universityCourseSelection.ts) rather than
//     whichever one they looked at last in the app.
//
// Secrets this needs (set with `supabase secrets set`, never by me):
//   WHATSAPP_VERIFY_TOKEN — a value YOU choose, entered into Meta's App
//     Dashboard webhook config to prove you own this endpoint.
//   WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID — from Meta's WhatsApp
//     Business Platform, to send the reply back.
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — to look up a student by
//     their linked whatsapp_phone and read their preferences, bypassing
//     RLS (this is a server-to-server webhook; there is no student session).
//   ANTHROPIC_API_KEY — read inside tutorCore.ts, same key ai-proxy uses.
//
// Deployed with --no-verify-jwt: Meta calls this with no Supabase session
// at all. The GET handshake below IS the one-time proof of ownership;
// ongoing POSTs are not further signed in this implementation (Meta does
// support an X-Hub-Signature-256 app-secret check — not implemented here;
// see the Phase 8 report's honest list of what a real launch still needs).

import { parseInboundMessage, verifyHandshake, isAssignmentStatusRequest, resolveWhatsAppTutorContext } from "../_shared/whatsappParsing.ts";
import { normalizePhone } from "../_shared/phoneNormalize.ts";
import { runTutorTurn } from "../_shared/tutorCore.ts";
import { checkAndIncrementRateLimit, TUTOR_DAILY_LIMIT } from "../_shared/rateLimitStore.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const WHATSAPP_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "";
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") ?? "";
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";

interface StudentRow {
  id: string;
  preferences: {
    educationLevel?: string;
    universityProfile?: { courses?: { name: string }[] };
  } | null;
}

async function findStudentByPhone(phone: string): Promise<StudentRow | null> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return null;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/students?whatsapp_phone=eq.${phone}&select=id,preferences`, {
    headers: { apikey: SERVICE_ROLE_KEY, authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as StudentRow[];
  return rows[0] ?? null;
}

async function fetchAssignmentStatusSummary(studentId: string): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/graded_submissions?student_id=eq.${studentId}&select=assignment_id,total_score,max_score,graded_at&order=graded_at.desc&limit=3`,
    { headers: { apikey: SERVICE_ROLE_KEY, authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
  );
  if (!res.ok) return "Couldn't check your assignments right now — try again shortly.";
  const rows = (await res.json()) as { assignment_id: string; total_score: number; max_score: number }[];
  if (rows.length === 0) return "No graded assignments yet. Submit one in the app and check back here.";
  const lines = rows.map((r) => `- ${r.assignment_id}: ${r.total_score}/${r.max_score}`);
  return `Your most recent graded work:\n${lines.join("\n")}`;
}

async function sendWhatsAppReply(to: string, text: string): Promise<void> {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) return; // not configured — nothing to send with
  await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const challenge = verifyHandshake(url.searchParams.get("hub.mode"), url.searchParams.get("hub.verify_token"), WHATSAPP_VERIFY_TOKEN);
    if (challenge === null) return new Response("forbidden", { status: 403 });
    return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
  }

  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ received: true, acted: false, reason: "invalid_json" }); // ack anyway — never make Meta retry a malformed body forever
  }

  const inbound = parseInboundMessage(body);
  if (!inbound) return json({ received: true, acted: false, reason: "not_a_text_message" });

  const phone = normalizePhone(inbound.from);
  const student = await findStudentByPhone(phone);
  if (!student) {
    await sendWhatsAppReply(inbound.from, "This number isn't linked to an Astra Study account yet. Open the app, go to Profile, and link this WhatsApp number first.");
    return json({ received: true, acted: false, reason: "no_linked_account" });
  }

  if (isAssignmentStatusRequest(inbound.text)) {
    const summary = await fetchAssignmentStatusSummary(student.id);
    await sendWhatsAppReply(inbound.from, summary);
    return json({ received: true, acted: true, kind: "assignment-status" });
  }

  const limit = await checkAndIncrementRateLimit(student.id, "tutor", TUTOR_DAILY_LIMIT, new Date());
  if (!limit.allowed) {
    await sendWhatsAppReply(inbound.from, "You've reached today's tutor message limit. Try again tomorrow, or ask in the app.");
    return json({ received: true, acted: false, reason: "rate_limited" });
  }

  const { level, courseName } = resolveWhatsAppTutorContext(student.preferences);

  // Stateless on purpose — see this file's header comment for why.
  const result = await runTutorTurn({ message: inbound.text, history: [], level, courseName });
  if ("error" in result) {
    await sendWhatsAppReply(inbound.from, "Astra couldn't respond just now. Try again in a moment.");
    return json({ received: true, acted: false, reason: result.error });
  }

  await sendWhatsAppReply(inbound.from, result.text.trim());
  return json({ received: true, acted: true, kind: "tutor" });
});
