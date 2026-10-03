import { Sparkles } from "lucide-react";
import { Button } from "../../../components/ui/Button";

interface Props {
  onStart: () => void;
  onSkip: () => void;
}

export function DiagnosticInviteStep({ onStart, onSkip }: Props) {
  return (
    <div className="space-y-6 text-center">
      <span className="mx-auto size-16 rounded-2xl bg-sage-surface flex items-center justify-center">
        <Sparkles className="size-8 text-sage" aria-hidden="true" />
      </span>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-ink">Want a head start?</h2>
        <p className="text-[15px] text-ink-secondary leading-relaxed">
          Answer a few quick questions so Astra can personalise your plan from day one. It takes about a minute, and
          there's no pressure — this just helps us understand where to begin.
        </p>
      </div>
      <div className="space-y-2.5">
        <Button size="lg" fullWidth onClick={onStart}>
          Take the quick quiz
        </Button>
        <Button size="lg" fullWidth variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}
