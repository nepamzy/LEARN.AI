import { useLocation, useNavigate } from "react-router-dom";
import { ShieldAlert, Clock, WifiOff, CheckCircle2 } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

const RULES = [
  { icon: Clock, text: "Once started, the timer runs continuously per subject — pausing isn't available in exam-condition mode." },
  { icon: ShieldAlert, text: "Hints, read-aloud, and tutor chat are turned off to match real exam conditions." },
  { icon: WifiOff, text: "If you lose connection, your answers stay saved on this device and sync when you're back online." },
  { icon: CheckCircle2, text: "You'll review every answer on a summary screen before final submission." },
];

export function ExamSimulatorIntroPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  return (
    <div className="pb-6 max-w-lg pt-2 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-ink">Before you start</h2>
        <p className="text-[15px] text-ink-secondary mt-1">A few things to know so there are no surprises.</p>
      </div>

      <Card className="space-y-4">
        {RULES.map((r, i) => (
          <div key={i} className="flex items-start gap-3">
            <r.icon className="size-5 text-sage shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[15px] text-ink leading-relaxed">{r.text}</p>
          </div>
        ))}
      </Card>

      <Button size="lg" fullWidth onClick={() => navigate("/exam/session", { state })}>
        Start when ready
      </Button>
    </div>
  );
}
