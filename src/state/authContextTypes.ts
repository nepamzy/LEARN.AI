import { createContext } from "react";
import type { Session } from "@supabase/supabase-js";

// Phase 8 §1a: three real states, not two — "no session yet" is genuinely
// different from "chose the demo account," and the UI (AuthGate) and the
// prefs-migration logic (AppStateContext) both need to tell them apart.
export type AuthStatus = "loading" | "signed-in" | "demo" | "signed-out";

export interface AuthState {
  status: AuthStatus;
  session: Session | null;
  /** The real auth.uid() once signed in, or undefined for demo/signed-out. */
  userId: string | undefined;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string; hasSession?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error?: string; hasSession?: boolean }>;
  signOut: () => Promise<void>;
  /** Explicit, labelled fallback — never the silent default. See the Phase 8 report. */
  continueAsDemo: () => void;
}

export const AuthCtx = createContext<AuthState | null>(null);
