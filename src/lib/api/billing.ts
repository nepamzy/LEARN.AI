import { supabase } from "../supabase";

// Phase 8 §1b: reads the ONE server-set field that drives every paid-tier
// gate. Nothing in the client ever writes this column — see billing.ts and
// the Paystack webhook for why.
export async function fetchPaidUntil(studentId: string): Promise<string | null> {
  const { data, error } = await supabase.from("students").select("paid_until").eq("id", studentId).maybeSingle();
  if (error) throw error;
  return (data?.paid_until as string | null) ?? null;
}
