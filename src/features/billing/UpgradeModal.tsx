import { useRef, useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { useAppState } from "../../state/useAppState";
import { useAuth } from "../../state/useAuth";
import { isPaymentsConfigured, openCheckout, PLAN_AMOUNT_KOBO } from "./paystackClient";

type Phase = "idle" | "opening" | "confirming" | "timed-out" | "error";

// Phase 8 §1b: a feature only unlocks once a webhook confirms it
// server-side — this component NEVER sets isPaidAccount itself. After the
// Paystack popup reports success, it polls refreshBilling() (which re-reads
// students.paid_until) a handful of times with backoff, and is honest if
// that window passes with no confirmation yet rather than pretending it
// worked or hanging forever.
const POLL_DELAYS_MS = [2000, 3000, 5000, 8000, 10000]; // ~28s total

export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { refreshBilling, isPaidAccount } = useAppState();
  const { session, status } = useAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const cancelled = useRef(false);

  const configured = isPaymentsConfigured();
  const isDemo = status === "demo";

  async function pollUntilPaidOrTimeout() {
    for (const delay of POLL_DELAYS_MS) {
      if (cancelled.current) return;
      await new Promise((r) => setTimeout(r, delay));
      refreshBilling();
      // Give the refresh a tick to land in state before checking it again
      // on the NEXT loop iteration — isPaidAccount itself is checked by the
      // caller via a fresh read after this function settles, since this
      // function closes over a stale value otherwise.
    }
  }

  async function handlePay() {
    if (!session?.user.email) return;
    setPhase("opening");
    cancelled.current = false;
    try {
      await openCheckout(
        session.user.email,
        () => {
          setPhase("confirming");
          void pollUntilPaidOrTimeout().then(() => {
            if (!cancelled.current) setPhase((p) => (p === "confirming" ? "timed-out" : p));
          });
        },
        () => setPhase((p) => (p === "opening" ? "idle" : p)) // popup closed without paying
      );
    } catch {
      setPhase("error");
    }
  }

  function handleClose() {
    cancelled.current = true;
    setPhase("idle");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Upgrade Astra Study">
      {isPaidAccount ? (
        <div className="text-center space-y-3 py-2">
          <CheckCircle2 className="size-8 text-success mx-auto" aria-hidden="true" />
          <p className="font-semibold text-ink">You're on the paid plan.</p>
          <Button fullWidth onClick={handleClose}>Done</Button>
        </div>
      ) : isDemo ? (
        <p className="text-[15px] text-ink-secondary">
          The demo account is always free-tier. Create a real account to upgrade.
        </p>
      ) : !configured ? (
        <p className="text-[15px] text-ink-secondary">
          Payments aren't switched on for this build yet. Your free-tier limits still apply.
        </p>
      ) : phase === "confirming" || phase === "timed-out" ? (
        <div className="text-center space-y-3 py-2">
          <Sparkles className="size-6 text-sage mx-auto animate-pulse" aria-hidden="true" />
          <p className="font-semibold text-ink">
            {phase === "confirming" ? "Confirming your payment…" : "Still confirming…"}
          </p>
          <p className="text-sm text-ink-secondary">
            {phase === "confirming"
              ? "This usually takes a few seconds once Paystack notifies us."
              : "This is taking longer than usual. Your account will update automatically once it's confirmed — feel free to close this and keep studying."}
          </p>
          <Button variant="secondary" fullWidth onClick={handleClose}>Close</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[15px] text-ink-secondary">
            ₦{(PLAN_AMOUNT_KOBO / 100).toLocaleString()}/month for unlimited tutor messages — paid by card, bank transfer, or USSD via Paystack.
          </p>
          {phase === "error" && (
            <p className="text-sm text-error font-medium" role="alert">
              Couldn't open the payment window. Check your connection and try again.
            </p>
          )}
          <Button fullWidth loading={phase === "opening"} onClick={() => void handlePay()}>
            Pay with Paystack
          </Button>
        </div>
      )}
    </Modal>
  );
}
