import { AiRateLimitError, AiUnavailableError } from "./types";
import { getCurrentStudentId } from "../studentId";

// Browser code only talks to a server-side proxy. LLM provider keys live in the
// proxy's secret store, never in a VITE_ variable (those are inlined into the bundle).
const PROXY_URL = import.meta.env?.VITE_AI_PROXY_URL as string | undefined;
const TIMEOUT_MS = 20_000;

export function isAiConfigured(): boolean {
  return !!PROXY_URL;
}

export async function callProxy<T>(kind: "tutor" | "grade" | "generate-assignment", body: unknown): Promise<T> {
  if (!PROXY_URL) throw new AiUnavailableError();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // Phase 8 §1a: studentId still reuses the same identity Supabase
    // reads/writes are scoped to (src/lib/supabase.ts), which is what the
    // Phase 4 rate limit is keyed on — but it is no longer trusted blindly.
    // A real signed-in session's access token is sent as a Bearer header
    // too; the proxy verifies it against Supabase Auth and uses the
    // token's OWN user id instead of the claimed studentId whenever a
    // token is present, so one signed-in student can no longer claim to be
    // another by sending a different studentId (closing the Phase 4 design's
    // open spoofing gap now that there is more than one real identity).
    // The demo account (no token) still authenticates purely by its fixed id.
    // Dynamically imported (not a static top-level import): authClient.ts
    // pulls in src/lib/supabase.ts, which reads import.meta.env directly
    // (no "?." guard, unlike PROXY_URL above) and throws under plain Node —
    // this file is imported by scripts/verify-ai.ts via isAiConfigured, so
    // a static import here would break that the moment this module loads,
    // not just when callProxy actually runs.
    const { getAccessToken } = await import("../auth/authClient");
    const accessToken = await getAccessToken();
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ kind, studentId: getCurrentStudentId(), ...(body as object) }),
      signal: controller.signal,
    });
    if (res.status === 429) throw new AiRateLimitError();
    if (!res.ok) throw new Error(`AI proxy responded ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
