import type { Session } from "@supabase/supabase-js";
import { supabase } from "../supabase";

// Phase 8 §1a: a thin wrapper around supabase-js's auth client. Kept
// separate from AuthContext.tsx (the React side) so the plain async
// functions here can be imported from proxyClient.ts without pulling React
// into it, the same "plain function, not a hook" split already used for
// src/lib/studentId.ts's getCurrentStudentId().

export interface AuthResult {
  error?: string;
  /** Only meaningful for signUp: true once Supabase returns an immediate session (email confirmation disabled for this project), false when it requires confirming by email first. */
  hasSession?: boolean;
}

export async function signUp(email: string, password: string, name: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  return { error: error?.message, hasSession: !!data.session };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

/**
 * The current session's access token, for the ai-proxy's own, independent
 * verification of who is actually calling it (see proxyClient.ts) — never
 * trust a client-claimed studentId alone once real accounts exist. Returns
 * undefined for the demo account (no session), which the proxy already
 * handles as its own, separately-authenticated case.
 */
export async function getAccessToken(): Promise<string | undefined> {
  const session = await getSession();
  return session?.access_token;
}
