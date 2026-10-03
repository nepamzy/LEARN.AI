import { Flame, Clock, Target } from "lucide-react";
import { amara, todayStudyMinutes } from "../../../lib/mockData";
import { greetingForHour, minutesToLabel, clamp } from "../../../lib/utils";

export function GreetingHeader() {
  const weeklyPct = clamp(Math.round((amara.weeklyGoalMinutesDone / amara.weeklyGoalMinutesTarget) * 100), 0, 100);

  return (
    <div className="pt-4 sm:pt-2 pb-2">
      <h2 className="text-2xl sm:text-[28px] font-bold text-ink leading-tight">
        {greetingForHour()}, {amara.name}.
      </h2>
      <p className="text-ink-secondary text-[15px] mt-1">Here's where things stand today.</p>

      <dl className="mt-4 grid grid-cols-3 gap-2.5">
        <div className="rounded-xl bg-surface border border-border px-3 py-2.5">
          <dt className="flex items-center gap-1.5 text-xs font-semibold text-ink-secondary">
            <Clock className="size-3.5" aria-hidden="true" /> Today
          </dt>
          <dd className="text-lg font-bold text-ink mt-0.5">{minutesToLabel(todayStudyMinutes)}</dd>
        </div>
        <div className="rounded-xl bg-surface border border-border px-3 py-2.5">
          <dt className="flex items-center gap-1.5 text-xs font-semibold text-ink-secondary">
            <Flame className="size-3.5" aria-hidden="true" /> Streak
          </dt>
          <dd className="text-lg font-bold text-ink mt-0.5">{amara.streakDays} days</dd>
        </div>
        <div className="rounded-xl bg-surface border border-border px-3 py-2.5">
          <dt className="flex items-center gap-1.5 text-xs font-semibold text-ink-secondary">
            <Target className="size-3.5" aria-hidden="true" /> Weekly goal
          </dt>
          <dd className="text-lg font-bold text-ink mt-0.5">{weeklyPct}%</dd>
        </div>
      </dl>
    </div>
  );
}
