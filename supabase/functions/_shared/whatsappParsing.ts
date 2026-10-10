// Phase 8 §1c: pure parsing of a WhatsApp Cloud API webhook payload — no
// Deno/Node/browser-specific globals, so scripts/verify-ai.ts can test it
// directly against real example payload shapes (from Meta's own docs),
// same "Deno-free shared module" split as rateLimit.ts since Phase 4.

export interface InboundWhatsAppMessage {
  from: string; // digits-only, country-code-prefixed, e.g. "2348012345678"
  text: string;
  messageId: string;
}

/**
 * Returns the first real inbound TEXT message found in a webhook POST
 * body, or null for anything else (a status callback, a non-text message
 * type, a malformed/unrelated payload) — those are acknowledged with 200
 * but produce no reply, never an error.
 */
export function parseInboundMessage(body: unknown): InboundWhatsAppMessage | null {
  if (!body || typeof body !== "object") return null;
  const entry = (body as Record<string, unknown>).entry;
  if (!Array.isArray(entry)) return null;

  for (const e of entry) {
    const changes = (e as Record<string, unknown>)?.changes;
    if (!Array.isArray(changes)) continue;
    for (const c of changes) {
      const value = (c as Record<string, unknown>)?.value as Record<string, unknown> | undefined;
      const messages = value?.messages;
      if (!Array.isArray(messages)) continue;
      for (const m of messages) {
        const msg = m as Record<string, unknown>;
        if (msg.type !== "text") continue;
        const from = msg.from;
        const text = (msg.text as Record<string, unknown> | undefined)?.body;
        const messageId = msg.id;
        if (typeof from === "string" && typeof text === "string" && typeof messageId === "string") {
          return { from, text, messageId };
        }
      }
    }
  }
  return null;
}

/** The webhook-registration handshake Meta's dashboard performs once when the webhook URL is first saved. */
export function verifyHandshake(mode: string | null, token: string | null, expectedToken: string): string | null {
  if (mode === "subscribe" && token === expectedToken) return token;
  return null;
}

export interface WhatsAppStudentPreferences {
  educationLevel?: string;
  universityProfile?: { courses?: { name: string }[] };
}

export interface WhatsAppTutorContext {
  level: string;
  courseName: string | undefined;
}

/**
 * Phase 8 §1c, §3 test #4: the "same course-awareness logic from Phase 7b"
 * requirement, made concrete and testable. There is no course SWITCHER on
 * WhatsApp (no rich UI — see whatsapp-webhook/index.ts's header comment),
 * so this always resolves to the student's FIRST added course — the exact
 * same "defaults to the first added" rule TutorPage's own switcher already
 * documents (src/lib/universityCourseSelection.ts's resolveActiveCourse,
 * called with no active id).
 */
export function resolveWhatsAppTutorContext(preferences: WhatsAppStudentPreferences | null | undefined): WhatsAppTutorContext {
  const level = preferences?.educationLevel ?? "senior-secondary";
  const courseName = level === "university" ? preferences?.universityProfile?.courses?.[0]?.name : undefined;
  return { level, courseName };
}

const ASSIGNMENT_STATUS_KEYWORDS = ["assignments", "assignment status", "status"];

/** A lightweight command, checked before routing to the AI tutor — "if reasonable" per the Phase 8 spec, kept intentionally simple. */
export function isAssignmentStatusRequest(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return ASSIGNMENT_STATUS_KEYWORDS.includes(normalized);
}
