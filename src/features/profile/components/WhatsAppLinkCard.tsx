import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/Input";
import { useAuth } from "../../../state/useAuth";
import { useToast } from "../../../components/ui/useToast";
import { fetchWhatsAppPhone, saveWhatsAppPhone } from "../../../lib/api/whatsappLink";
import { normalizePhone } from "../../../lib/phoneNormalize";

// Phase 8 §1c: links a WhatsApp number to this account so an inbound
// message can be routed to it. Self-asserted, not OTP-verified — see
// whatsappLink.ts's comment for exactly what that does and doesn't prove.
export function WhatsAppLinkCard() {
  const { userId } = useAuth();
  const { show } = useToast();
  const [linked, setLinked] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchWhatsAppPhone(userId)
      .then(setLinked)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleLink() {
    if (!userId || !input.trim()) return;
    setSaving(true);
    try {
      await saveWhatsAppPhone(userId, input.trim());
      // Mirror exactly what was actually saved (normalizePhone's output),
      // not the raw typed string — saveWhatsAppPhone normalizes before
      // writing, so showing the raw input back would display a number
      // that doesn't match what's actually stored.
      setLinked(normalizePhone(input.trim()));
      setInput("");
      show("WhatsApp number linked.", "success");
    } catch {
      show("Couldn't link that number — try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleUnlink() {
    if (!userId) return;
    setSaving(true);
    try {
      await saveWhatsAppPhone(userId, null);
      setLinked(null);
      show("WhatsApp number unlinked.", "info");
    } catch {
      show("Couldn't unlink that number — try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <Card>
      <h3 className="font-bold text-ink text-[16px] mb-1 inline-flex items-center gap-1.5">
        <MessageCircle className="size-4 text-sage" aria-hidden="true" /> WhatsApp
      </h3>
      <p className="text-sm text-ink-secondary mb-3">
        Message Astra on WhatsApp for quick questions on the go. We don't verify this number belongs to you — don't
        link a number someone else might message from.
      </p>
      {linked ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border-strong bg-surface px-4 py-3">
          <p className="text-[15px] font-medium text-ink">+{linked}</p>
          <Button variant="secondary" size="sm" loading={saving} onClick={() => void handleUnlink()}>
            <X className="size-3.5" aria-hidden="true" /> Unlink
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="flex-1">
            <TextInput label="WhatsApp number" placeholder="+234 801 234 5678" value={input} onChange={(e) => setInput(e.target.value)} />
          </div>
          <Button className="self-end" loading={saving} disabled={!input.trim()} onClick={() => void handleLink()}>
            Link
          </Button>
        </div>
      )}
    </Card>
  );
}
