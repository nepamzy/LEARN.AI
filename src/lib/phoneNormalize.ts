// Client-side copy of supabase/functions/_shared/phoneNormalize.ts — see
// that file's comment for why this is deliberately duplicated rather than
// cross-imported across the src/ <-> supabase/functions/ boundary. Kept
// byte-for-byte identical in logic; change both together.
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) digits = "234" + digits.slice(1);
  if (!digits.startsWith("234") && digits.length === 10) digits = "234" + digits;
  return digits;
}
