import { getCurrentStudentId } from "../../lib/supabase";

// Phase 8 §1b: Paystack chosen over Stripe/Flutterwave for this market —
// Nigerian naira as a native currency, bank transfer and USSD alongside
// cards (most relevant for Nigerian university students, many of whom are
// not card-first), and a public-key-only client checkout (Paystack Inline)
// that needs no server round-trip just to open the payment popup — the
// server's only job is verifying the webhook afterward (see
// supabase/functions/paystack-webhook/index.ts). See the Phase 8 report for
// the full comparison.

const PUBLIC_KEY = import.meta.env?.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;
const INLINE_JS_URL = "https://js.paystack.co/v1/inline.js";
const PLAN_AMOUNT_KOBO = 150_000; // ₦1,500/month — see the Phase 8 report for how this figure was chosen
const PLAN_DAYS = 30;

export function isPaymentsConfigured(): boolean {
  return !!PUBLIC_KEY;
}

interface PaystackPop {
  setup(options: {
    key: string;
    email: string;
    amount: number;
    currency: string;
    metadata: { studentId: string; planDays: number };
    callback: (response: { reference: string }) => void;
    onClose: () => void;
  }): { openIframe(): void };
}

declare global {
  interface Window {
    PaystackPop?: PaystackPop;
  }
}

let scriptLoading: Promise<void> | null = null;

function loadInlineScript(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve();
  if (scriptLoading) return scriptLoading;
  scriptLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = INLINE_JS_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Couldn't load the payment popup. Check your connection and try again."));
    document.head.appendChild(script);
  });
  return scriptLoading;
}

/**
 * Opens Paystack's Inline checkout popup. `onPopupSuccess` fires the moment
 * the POPUP reports success — this is NOT proof of payment server-side; the
 * caller must treat it only as "a confirmation webhook should be arriving
 * shortly" and poll/refresh the real paid_until field, never flip a gate
 * directly from this callback (see UpgradeModal.tsx).
 */
export async function openCheckout(email: string, onPopupSuccess: (reference: string) => void, onClose: () => void): Promise<void> {
  if (!PUBLIC_KEY) throw new Error("not_configured");
  await loadInlineScript();
  if (!window.PaystackPop) throw new Error("not_configured");
  window.PaystackPop.setup({
    key: PUBLIC_KEY,
    email,
    amount: PLAN_AMOUNT_KOBO,
    currency: "NGN",
    metadata: { studentId: getCurrentStudentId(), planDays: PLAN_DAYS },
    callback: (response) => onPopupSuccess(response.reference),
    onClose,
  }).openIframe();
}

export { PLAN_AMOUNT_KOBO, PLAN_DAYS };
