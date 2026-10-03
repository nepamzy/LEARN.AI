import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { todayPlan } from "../../lib/mockData";
import { WeekStrip } from "./components/WeekStrip";
import { DailyPlanItem } from "./components/DailyPlanItem";
import { BuildSessionDrawer } from "./components/BuildSessionDrawer";
import { Drawer } from "../../components/ui/Drawer";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { CalendarCheck2 } from "lucide-react";
import { minutesToLabel } from "../../lib/utils";
import { getStartOfToday } from "../../lib/dates";
import type { PlanTask } from "../../lib/types";

function buildWeek(today: Date, todayTaskCount: number) {
  const todayIndex = today.getDay();
  const start = new Date(today);
  start.setDate(today.getDate() - todayIndex);
  return Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return { date, taskCount: i === todayIndex ? todayTaskCount : 0 };
  });
}

export function LearnPage() {
  const today = useMemo(() => getStartOfToday(), []);
  const todayIndex = today.getDay();
  const week = useMemo(() => buildWeek(today, todayPlan.length), [today]);
  const [selectedIndex, setSelectedIndex] = useState(todayIndex);
  const [buildOpen, setBuildOpen] = useState(false);
  const [whyTask, setWhyTask] = useState<PlanTask | null>(null);

  const isToday = selectedIndex === todayIndex;
  const tasks = isToday ? todayPlan : [];
  const totalMinutes = tasks.reduce((s, t) => s + t.estimatedMinutes, 0);

  return (
    <div className="pb-6 space-y-5 pt-2">
      <WeekStrip days={week} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">{isToday ? "Today's plan" : week[selectedIndex].date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}</h2>
          {tasks.length > 0 && (
            <p className="text-sm text-ink-secondary mt-0.5">
              {tasks.length} tasks · about {minutesToLabel(totalMinutes)}
            </p>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={() => setBuildOpen(true)}>
          <Plus className="size-4" aria-hidden="true" /> Build session
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck2 className="size-6" aria-hidden="true" />}
          title={isToday ? "Nothing scheduled for today" : "No plan for this day yet"}
          description="Your plan rebalances automatically as you study. You can also build your own session anytime."
          action={
            <Button size="sm" onClick={() => setBuildOpen(true)}>
              Build a session
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <DailyPlanItem key={task.id} task={task} onShowWhy={setWhyTask} />
          ))}
        </div>
      )}

      <BuildSessionDrawer open={buildOpen} onClose={() => setBuildOpen(false)} />

      <Drawer open={!!whyTask} onClose={() => setWhyTask(null)} title="Why am I seeing this?">
        {whyTask && (
          <>
            <p>{whyTask.reason}.</p>
            <p className="mt-3 text-ink-secondary">
              Astra chooses what to show you each day based on how your memory of each topic is holding up, how
              recently you've practiced it, and how close your exam date is — never a fixed schedule everyone gets.
            </p>
          </>
        )}
      </Drawer>
    </div>
  );
}
