import { Lightbulb, TrendingUp, AlertCircle } from "lucide-react";
import type { Insight } from "../../lib/types";
import { Card } from "../ui/Card";
import { cx } from "../../lib/utils";

const kindConfig = {
  positive: { icon: TrendingUp, classes: "bg-sage-surface text-sage" },
  neutral: { icon: Lightbulb, classes: "bg-info-surface text-info" },
  attention: { icon: AlertCircle, classes: "bg-amber-surface text-amber" },
};

export function InsightCard({ insight, className }: { insight: Insight; className?: string }) {
  const cfg = kindConfig[insight.kind];
  const Icon = cfg.icon;
  return (
    <Card className={cx("flex gap-3", className)}>
      <span className={cx("size-9 rounded-full flex items-center justify-center shrink-0", cfg.classes)}>
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-1">Astra's insight</p>
        <p className="text-[15px] text-ink leading-relaxed">{insight.message}</p>
      </div>
    </Card>
  );
}
