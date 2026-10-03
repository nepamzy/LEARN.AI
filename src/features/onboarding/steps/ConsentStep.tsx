import { ShieldCheck } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/Input";
import { cx } from "../../../lib/utils";

interface Props {
  isUnderage: boolean;
  guardianEmail: string;
  onSetUnderage: (v: boolean) => void;
  onGuardianEmailChange: (v: string) => void;
  onNext: () => void;
  error?: string;
}

export function ConsentStep({ isUnderage, guardianEmail, onSetUnderage, onGuardianEmailChange, onNext, error }: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-ink">One last check</h2>
        <p className="text-[15px] text-ink-secondary">This helps us keep your data handled responsibly.</p>
      </div>

      <div role="radiogroup" aria-label="Are you under 18?" className="grid grid-cols-2 gap-2.5">
        {[
          { v: false, label: "I'm 18 or older" },
          { v: true, label: "I'm under 18" },
        ].map((opt) => (
          <button
            key={String(opt.v)}
            role="radio"
            aria-checked={isUnderage === opt.v}
            onClick={() => onSetUnderage(opt.v)}
            className={cx(
              "rounded-xl border px-3.5 py-3 text-[15px] font-semibold transition-colors duration-150",
              isUnderage === opt.v ? "border-sage bg-sage-surface text-ink" : "border-border-strong bg-surface text-ink hover:border-sage/50"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isUnderage && (
        <div className="rounded-xl border border-border-strong bg-[#F8F7F2] p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="size-5 text-sage shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-ink-secondary leading-relaxed">
              Since you're under 18, we'll ask a parent or guardian to confirm consent before your account is fully
              active. You can keep exploring in the meantime.
            </p>
          </div>
          <TextInput
            label="Parent or guardian's email"
            type="email"
            placeholder="parent@example.com"
            value={guardianEmail}
            onChange={(e) => onGuardianEmailChange(e.target.value)}
            error={error}
          />
        </div>
      )}

      <Button size="lg" fullWidth onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}
