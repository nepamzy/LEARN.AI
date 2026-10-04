import { AiRateLimitError, AiUnavailableError } from "./types";
import { DEMO_STUDENT_ID } from "../studentId";

// Browser code only talks to a server-side proxy. LLM provider keys live in the
// proxy's secret store, never in a VITE_ variable (those are inlined into the bundle).
const PROXY_URL = import.meta.env?.VITE_AI_PROXY_URL as string | undefined;
const TIMEOUT_MS = 20_000;

export function isAiConfigured(): boolean {
  return !!PROXY_URL;
}

export async function callProxy<T>(kind: "tutor" | "grade", body: unknown): Promise<T> {
  if (!PROXY_URL) throw new AiUnavailableError();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // studentId reuses the same single-demo-student identity already used
      // for Supabase reads/writes (src/lib/supabase.ts) — it's what the
      // Phase 4 Edge Function rate limit is keyed on. No new identity or
      // auth scheme introduced here.
      body: JSON.stringify({ kind, studentId: DEMO_STUDENT_ID, ...(body as object) }),
      signal: controller.signal,
    });
    if (res.status === 429) throw new AiRateLimitError();
    if (!res.ok) throw new Error(`AI proxy responded ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
