import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { DEMO_STUDENT_ID, setCurrentStudentId } from "../lib/studentId";
import { loadLocal, saveLocal, removeLocal } from "../lib/storage";
import * as auth from "../lib/auth/authClient";
import { AuthCtx, type AuthState, type AuthStatus } from "./authContextTypes";

// Phase 8 §1a: the real front door. On load: a real session (if one was
// persisted by supabase-js) always wins; otherwise, the explicit "continue
// with the demo account" choice (saved locally) is honoured; otherwise
// AuthGate (see components/AuthGate.tsx) shows sign-in/sign-up/demo choices.
// Demo is never the silent default for a brand-new visitor — see the
// Phase 8 report for why that's the deliberate call, not an oversight.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const initialised = useRef(false);

  useEffect(() => {
    let cancelled = false;
    auth.getSession().then((s) => {
      if (cancelled) return;
      if (s) {
        setSession(s);
        setCurrentStudentId(s.user.id);
        setStatus("signed-in");
      } else if (loadLocal("authMode", false)) {
        setCurrentStudentId(DEMO_STUDENT_ID);
        setStatus("demo");
      } else {
        setStatus("signed-out");
      }
      initialised.current = true;
    });

    const unsubscribe = auth.onAuthStateChange((s) => {
      if (!initialised.current) return; // the initial getSession() above already handles the first value
      setSession(s);
      if (s) {
        setCurrentStudentId(s.user.id);
        removeLocal("authMode"); // a real session always supersedes a prior demo choice
        setStatus("signed-in");
      } else {
        // Signed out. Fall back to demo only if that was already explicitly
        // chosen before (never re-show demo automatically otherwise).
        if (loadLocal("authMode", false)) {
          setCurrentStudentId(DEMO_STUDENT_ID);
          setStatus("demo");
        } else {
          setCurrentStudentId(DEMO_STUDENT_ID);
          setStatus("signed-out");
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  function continueAsDemo() {
    saveLocal("authMode", true);
    setCurrentStudentId(DEMO_STUDENT_ID);
    setStatus("demo");
  }

  async function signOut() {
    removeLocal("authMode");
    await auth.signOut();
    setCurrentStudentId(DEMO_STUDENT_ID);
    setSession(null);
    setStatus("signed-out");
  }

  const value: AuthState = {
    status,
    session,
    userId: session?.user.id,
    signUp: auth.signUp,
    signIn: auth.signIn,
    signOut,
    continueAsDemo,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
