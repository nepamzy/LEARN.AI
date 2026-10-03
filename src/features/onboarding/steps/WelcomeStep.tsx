import { Compass } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-6">
      <span className="mx-auto size-16 rounded-2xl bg-sage-surface flex items-center justify-center">
        <Compass className="size-8 text-sage" aria-hidden="true" />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-ink">Let's make your study time count.</h1>
        <p className="text-[15px] text-ink-secondary leading-relaxed">
          Astra Study remembers what you know, notices what you struggle with, and tells you exactly what to study next.
          Setup takes under two minutes.
        </p>
      </div>
      <Button size="lg" fullWidth onClick={onNext}>
        Get started
      </Button>
    </div>
  );
}
