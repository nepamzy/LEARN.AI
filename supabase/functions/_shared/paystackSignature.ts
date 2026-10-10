// Phase 8 §1b: verifies a Paystack webhook's `x-paystack-signature` header —
// an HMAC-SHA512 of the raw request body, keyed with the account's secret
// key (see https://paystack.com/docs/payments/webhooks/#verifying-events).
// Deliberately uses the Web Crypto API (globalThis.crypto.subtle) rather
// than node:crypto or a Deno-only API: SubtleCrypto is available, with the
// same interface, in Deno (the deployed Edge Function), the browser, and
// Node 19+ (this project's tsx-run test scripts) — the same "Deno-free
// shared module" reasoning as rateLimit.ts since Phase 4, extended to a
// capability neither Deno- nor Node-specific module ever needed before.

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  return bytes;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * @param rawBody the exact, unparsed request body bytes/text Paystack sent —
 *   the signature is over the raw bytes, so this must NOT be a re-serialized
 *   JSON.stringify(JSON.parse(body)), which can differ in whitespace/key order.
 * @param signatureHeader the `x-paystack-signature` header value.
 * @param secretKey the account's Paystack secret key (never the public key).
 */
export async function verifyPaystackSignature(rawBody: string, signatureHeader: string | null, secretKey: string): Promise<boolean> {
  if (!signatureHeader || !secretKey) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secretKey), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expectedHex = bytesToHex(signature);
  // hexToBytes round-trip on the header isn't strictly needed for a hex
  // comparison, but validates it actually IS hex before the length/char
  // comparison below, rejecting a malformed header outright rather than
  // comparing garbage.
  try {
    hexToBytes(signatureHeader);
  } catch {
    return false;
  }
  return timingSafeEqual(expectedHex, signatureHeader.toLowerCase());
}

export interface PaystackChargeEvent {
  event: string;
  data: {
    status?: string;
    reference?: string;
    customer?: { email?: string };
    metadata?: { studentId?: string; planDays?: number } | null;
  };
}

/** Parses + narrows a webhook body; returns null for anything not shaped like a Paystack event. */
export function parsePaystackEvent(rawBody: string): PaystackChargeEvent | null {
  try {
    const parsed = JSON.parse(rawBody) as Record<string, unknown>;
    if (typeof parsed.event !== "string" || typeof parsed.data !== "object" || parsed.data === null) return null;
    return parsed as unknown as PaystackChargeEvent;
  } catch {
    return null;
  }
}

/** How many days a successful charge should extend paid_until by. Capped so a malformed/malicious metadata.planDays can't grant an absurd subscription length. */
export const DEFAULT_PLAN_DAYS = 30;
export const MAX_PLAN_DAYS = 366;

export function resolvePlanDays(metadata: PaystackChargeEvent["data"]["metadata"]): number {
  const requested = metadata?.planDays;
  if (typeof requested !== "number" || !Number.isFinite(requested) || requested <= 0) return DEFAULT_PLAN_DAYS;
  return Math.min(Math.round(requested), MAX_PLAN_DAYS);
}

/**
 * The new paid_until value a successful charge should set, extending from
 * whichever is later — now, or the account's current paid_until (so a
 * renewal before expiry adds on top rather than wasting the remaining time).
 */
export function extendPaidUntil(currentPaidUntil: string | null, planDays: number, now: Date): string {
  const base = currentPaidUntil && Date.parse(currentPaidUntil) > now.getTime() ? new Date(currentPaidUntil) : now;
  return new Date(base.getTime() + planDays * 86_400_000).toISOString();
}

export function isPaid(paidUntil: string | null | undefined, now: Date): boolean {
  return !!paidUntil && Date.parse(paidUntil) > now.getTime();
}
