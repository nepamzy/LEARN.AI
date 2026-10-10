import { supabase } from "../supabase";
import { normalizePhone } from "../phoneNormalize";

// Phase 8 §1c: self-asserted linking only — this does NOT verify the
// student actually owns this WhatsApp number (no OTP/SMS challenge, out of
// scope for this phase — see the Phase 8 report). Anyone who knows a
// student's phone number could type it into their OWN account's Profile
// page, which would make THAT message now route to the wrong account's
// course context — a real limitation, stated honestly, not hidden.
export async function fetchWhatsAppPhone(studentId: string): Promise<string | null> {
  const { data, error } = await supabase.from("students").select("whatsapp_phone").eq("id", studentId).maybeSingle();
  if (error) throw error;
  return (data?.whatsapp_phone as string | null) ?? null;
}

export async function saveWhatsAppPhone(studentId: string, phone: string | null): Promise<void> {
  const normalized = phone ? normalizePhone(phone) : null;
  const { error } = await supabase.from("students").update({ whatsapp_phone: normalized }).eq("id", studentId);
  if (error) throw error;
}
