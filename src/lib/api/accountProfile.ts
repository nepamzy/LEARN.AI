import { supabase } from "../supabase";

// Phase 8 §1a: the account-scoped half of Preferences (see
// src/lib/accountPrefsSync.ts) — read/write the one jsonb column added for
// this in the Phase 8 migration. Only ever called for a real signed-in
// account (see AppStateContext.tsx); the demo account never touches this.
export async function fetchAccountPreferences(studentId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase.from("students").select("preferences").eq("id", studentId).maybeSingle();
  if (error) throw error;
  return (data?.preferences as Record<string, unknown> | null) ?? null;
}

export async function saveAccountPreferences(studentId: string, prefs: object): Promise<void> {
  const { error } = await supabase.from("students").update({ preferences: prefs }).eq("id", studentId);
  if (error) throw error;
}
