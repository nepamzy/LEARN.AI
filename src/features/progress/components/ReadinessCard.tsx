import { Info } from "lucide-react";
import { CircularProgress } from "../../../components/ui/Progress";
import { Card } from "../../../components/ui/Card";

export function ReadinessCard({ pct }: { pct: number }) {
  return (
    <Card className="flex items-center gap-4">
      <CircularProgress value={pct} size={88} strokeWidth={8} label={`Estimated readiness ${pct}%`}>
        <span className="text-xl font-bold text-ink">{pct}%</span>
      </CircularProgress>
      <div className="flex-1">
        <h3 className="font-bold text-ink text-[16px]">Estimated readiness</h3>
        <p className="text-sm text-ink-secondary mt-1 leading-relaxed">
          Based on your recent practice across all subjects. This is an estimate to guide your study, not a
          guaranteed exam score.
        </p>
        <p className="flex items-center gap-1 text-xs text-ink-secondary mt-1.5">
          <Info className="size-3.5" aria-hidden="true" /> Updates as you practice
        </p>
      </div>
    </Card>
  );
}
