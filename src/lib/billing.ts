// Phase 8 §1b: the one client-side billing decision — never anything that
// SETS paid_until (only the Paystack webhook does that; see
// supabase/functions/paystack-webhook/index.ts and its own isPaid, kept as a
// separate copy there deliberately rather than cross-imported, so the Edge
// Function directory stays self-contained and independently deployable).
export function isPaid(paidUntil: string | null | undefined, now: Date): boolean {
  return !!paidUntil && Date.parse(paidUntil) > now.getTime();
}
