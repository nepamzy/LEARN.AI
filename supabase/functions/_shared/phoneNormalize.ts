// Phase 8 §1c: normalises a Nigerian phone number to the digits-only,
// country-code-prefixed form WhatsApp's Cloud API sends inbound numbers in
// (e.g. "2348012345678"), so a student's self-typed Profile number
// ("+234 801 234 5678", "08012345678", "234-801-234-5678", …) matches it.
// Deno-free (plain string logic, no Deno/Node/browser globals) so
// scripts/verify-ai.ts can test it directly — the same split as
// rateLimit.ts since Phase 4. A client-side copy exists at
// src/lib/phoneNormalize.ts for the same reason billing.ts's isPaid is
// duplicated rather than cross-imported: supabase/functions/ stays a
// self-contained, independently deployable directory.

export function normalizePhone(raw: string): string {
  let digits = raw.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) digits = "234" + digits.slice(1); // Nigerian local format -> country code
  if (!digits.startsWith("234") && digits.length === 10) digits = "234" + digits; // bare 10-digit local number, no leading 0
  return digits;
}
