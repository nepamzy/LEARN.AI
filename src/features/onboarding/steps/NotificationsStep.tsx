import { BellRing } from "lucide-react";
import { Button } from "../../../components/ui/Button";

interface Props {
  onChoice: (choice: "granted" | "denied" | "later") => void;
}

export function NotificationsStep({ onChoice }: Props) {
  return (
    <div className="space-y-6 text-center">
      <span className="mx-auto size-16 rounded-2xl bg-sage-surface flex items-center justify-center">
        <BellRing className="size-8 text-sage" aria-hidden="true" />
      </span>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-ink">Stay on track with gentle reminders?</h2>
        <p className="text-[15px] text-ink-secondary leading-relaxed">
          We only remind you when something is due for review — never random noise, and never more than a couple of
          times a day.
        </p>
      </div>
      <div className="space-y-2.5">
        <Button size="lg" fullWidth onClick={() => onChoice("granted")}>
          Allow reminders
        </Button>
        <Button size="lg" fullWidth variant="ghost" onClick={() => onChoice("later")}>
          Not now
        </Button>
      </div>
    </div>
  );
}
