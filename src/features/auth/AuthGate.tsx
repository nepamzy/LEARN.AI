import { useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "../../state/useAuth";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { TextInput } from "../../components/ui/Input";

// Phase 8 §1a: the real front door for every new or returning visitor.
// Three explicit choices — sign in, create a real account, or continue
// with the demo account — none of them a silent default. See the Phase 8
// report for why "continue with demo" is a labelled, deliberate choice
// rather than the fallback that happens automatically.
type Mode = "signin" | "signup";

export function AuthGate({ children }: { children: ReactNode }) {
  const { status, signIn, signUp, continueAsDemo } = useAuth();

  if (status === "loading") return null; // brief; avoids a flash of the sign-in form on an already-signed-in return visit
  if (status !== "signed-out") return <>{children}</>;

  return <AuthForm signIn={signIn} signUp={signUp} continueAsDemo={continueAsDemo} />;
}

function AuthForm({
  signIn,
  signUp,
  continueAsDemo,
}: {
  signIn: (email: string, password: string) => Promise<{ error?: string; hasSession?: boolean }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string; hasSession?: boolean }>;
  continueAsDemo: () => void;
}) {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSubmitting(true);
    const result = mode === "signin" ? await signIn(email, password) : await signUp(email, password, name.trim());
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    // Phase 8 §1a: Supabase Auth's default project setting requires email
    // confirmation before a session exists — a signUp call can succeed with
    // no error and still leave the visitor signed out until they click the
    // confirmation link, which this sandbox cannot send or receive. Only
    // show that honest "check your email" state when signUp actually came
    // back with no session; if the project has confirmation disabled (or a
    // real project returns one some other way), onAuthStateChange already
    // picks up the real session and AuthGate steps aside on its own —
    // showing "check your email" on TOP of an already-usable account would
    // be a confusing, needless extra step.
    if (mode === "signup" && !result.hasSession) setCheckEmail(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-canvas">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-ink">Astra Study</h1>
          <p className="text-sm text-ink-secondary">Sign in to keep your progress, anywhere you study from.</p>
        </div>

        <Card className="space-y-4">
          {checkEmail ? (
            <div className="text-center space-y-3 py-2">
              <Sparkles className="size-6 text-sage mx-auto" aria-hidden="true" />
              <p className="text-[15px] font-semibold text-ink">Check your email</p>
              <p className="text-sm text-ink-secondary">
                We've sent a confirmation link to {email}. Follow it, then come back and sign in.
              </p>
              <Button variant="secondary" fullWidth onClick={() => { setCheckEmail(false); setMode("signin"); }}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <div className="flex rounded-xl border border-border-strong p-1 bg-surface" role="tablist" aria-label="Sign in or create account">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signin"}
                  onClick={() => { setMode("signin"); setError(undefined); }}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === "signin" ? "bg-sage text-white" : "text-ink-secondary"}`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signup"}
                  onClick={() => { setMode("signup"); setError(undefined); }}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === "signup" ? "bg-sage text-white" : "text-ink-secondary"}`}
                >
                  Create account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === "signup" && (
                  <TextInput label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
                )}
                <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                <TextInput
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  hint={mode === "signup" ? "At least 8 characters." : undefined}
                  required
                />
                {error && (
                  <p className="text-sm text-error font-medium" role="alert">
                    {error}
                  </p>
                )}
                <Button type="submit" fullWidth loading={submitting} disabled={!email.trim() || !password.trim() || (mode === "signup" && !name.trim())}>
                  {mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>
            </>
          )}
        </Card>

        {!checkEmail && (
          <div className="text-center">
            <button onClick={continueAsDemo} className="text-sm font-semibold text-ink-secondary hover:text-sage underline-offset-2 hover:underline">
              Continue with the demo account instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
