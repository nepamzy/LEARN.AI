// Phase 8 §1b: receives Paystack's server-to-server webhook confirming a
// payment, and is the ONLY thing that ever sets a student's paid_until —
// the client never fabricates a paid state for itself (see
// src/features/billing/UpgradeCard.tsx, which only ever shows "confirming…"
// after a checkout, never flips any gate itself).
//
// Secrets this needs (set with `supabase secrets set`, never by me):
//   PAYSTACK_SECRET_KEY — verifies the webhook's signature.
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — to update students.paid_until
//     with a key that bypasses RLS (the same pattern ai-proxy's rate
//     limiter already uses for rate_limit_counters).
//
// Deployed with --no-verify-jwt, same as ai-proxy: Paystack calls this
// directly with no Supabase session, so the ONLY real authentication here
// is the signature check below — reject anything that doesn't pass it.

import { verifyPaystackSignature, parsePaystackEvent, resolvePlanDays, extendPaidUntil } from "../_shared/paystackSignature.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function fetchCurrentPaidUntil(studentId: string): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${studentId}&select=paid_until`, {
    headers: { apikey: SERVICE_ROLE_KEY, authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as { paid_until: string | null }[];
  return rows[0]?.paid_until ?? null;
}

async function setPaidUntil(studentId: string, paidUntil: string): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${studentId}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      prefer: "return=minimal",
    },
    body: JSON.stringify({ paid_until: paidUntil }),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !PAYSTACK_SECRET_KEY) {
    // Misconfigured deployment — fail closed, never silently accept an
    // unverifiable webhook.
    return json({ error: "not_configured" }, 503);
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  const validSignature = await verifyPaystackSignature(rawBody, signature, PAYSTACK_SECRET_KEY);
  if (!validSignature) return json({ error: "invalid_signature" }, 401);

  const event = parsePaystackEvent(rawBody);
  if (!event) return json({ error: "invalid_payload" }, 400);

  // Only a confirmed successful charge ever extends access. Every other
  // event type (refund, dispute, subscription.disable, etc.) is
  // acknowledged with 200 (so Paystack stops retrying it) but changes nothing.
  if (event.event !== "charge.success" || event.data.status !== "success") {
    return json({ received: true, acted: false });
  }

  const studentId = event.data.metadata?.studentId;
  if (!studentId || !/^[0-9a-f-]{36}$/i.test(studentId)) {
    // A charge with no recognisable student to credit — acknowledge receipt
    // (it's a real, signature-verified Paystack event) but there is nothing
    // safe to apply it to.
    return json({ received: true, acted: false, reason: "no_student_id" });
  }

  const currentPaidUntil = await fetchCurrentPaidUntil(studentId);
  const planDays = resolvePlanDays(event.data.metadata);
  const newPaidUntil = extendPaidUntil(currentPaidUntil, planDays, new Date());
  const applied = await setPaidUntil(studentId, newPaidUntil);

  return json({ received: true, acted: applied, paidUntil: applied ? newPaidUntil : undefined });
});
