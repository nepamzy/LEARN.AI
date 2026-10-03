import { Flame, Target, Trophy, Star, CheckCircle2 } from "lucide-react";
import type { Achievement } from "../../lib/types";
import { formatDate } from "../../lib/utils";

const iconMap = {
  flame: Flame,
  target: Target,
  trophy: Trophy,
  star: Star,
  check: CheckCircle2,
};

export function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const Icon = iconMap[achievement.icon];
  return (
    <div className="flex items-center gap-3 shrink-0 w-56 rounded-xl border border-border bg-surface px-3.5 py-3">
      <span className="size-9 rounded-full bg-amber-surface text-amber flex items-center justify-center shrink-0">
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{achievement.title}</p>
        <p className="text-xs text-ink-secondary truncate">{formatDate(achievement.date)}</p>
      </div>
    </div>
  );
}
