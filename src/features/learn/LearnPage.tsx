import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, GraduationCap } from "lucide-react";
import { todayPlan, amara } from "../../lib/mockData";
import { effectiveEducationLevel } from "../../lib/educationLevel";
import { availableSubjectsForLevel, universityContentGateNotice } from "../../lib/levelContent";
import { WeekStrip } from "./components/WeekStrip";
import { DailyPlanItem } from "./components/DailyPlanItem";
import { BuildSessionDrawer } from "./components/BuildSessionDrawer";
import { Drawer } from "../../components/ui/Drawer";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { CalendarCheck2 } from "lucide-react";
import { minutesToLabel } from "../../lib/utils";
import { getStartOfToday } from "../../lib/dates";
import { useAppState } from "../../state/useAppState";
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
  const { prefs } = useAppState();
  const level = effectiveEducationLevel(prefs.educationLevel, amara.educationLevel);
  const universityCourses = prefs.universityProfile?.courses ?? [];
  // Phase 7c §1c: scoped to this level's own subjects — previously every
  // level saw Amara's full plan unfiltered, including subjects (biology,
  // chemistry) a Primary or Junior Secondary account never studies.
  const availableSubjects = availableSubjectsForLevel(level, universityCourses);
  // Daily planning (todayPlan) doesn't exist for ANY university course yet,
  // pilot included — it's a separate, not-yet-built system, distinct from
  // §1d's practice/mastery pilot — so university always gets an honest
  // gate here, never an empty "nothing scheduled" that implies a working
  // planner. coursesGate (pointing to Profile) takes priority when it's the
  // courses themselves that are missing; otherwise it's the planner itself
  // that doesn't exist yet (pointing to Tutor instead).
  const coursesGate = level === "university" ? universityContentGateNotice(universityCourses) : null;
  const gateNotice =
    level === "university"
      ? coursesGate ?? {
          title: "Daily planning isn't built for university yet",
          description: "Astra doesn't build a day-by-day study plan for university courses yet. Ask Astra about your coursework in the Tutor tab, or request a practice assignment instead.",
        }
      : null;

  const todayTasks = todayPlan.filter((t) => availableSubjects.some((s) => s.id === t.subjectId));
  const today = useMemo(() => getStartOfToday(), []);
  const todayIndex = today.getDay();
  const week = useMemo(() => buildWeek(today, todayTasks.length), [today, todayTasks.length]);
  const [selectedIndex, setSelectedIndex] = useState(todayIndex);
  const [buildOpen, setBuildOpen] = useState(false);
  const [whyTask, setWhyTask] = useState<PlanTask | null>(null);

  const isToday = selectedIndex === todayIndex;
  const tasks = isToday ? todayTasks : [];
  const totalMinutes = tasks.reduce((s, t) => s + t.estimatedMinutes, 0);

  if (gateNotice) {
    return (
      <Card>
        <EmptyState
          icon={<GraduationCap className="size-6" aria-hidden="true" />}
          title={gateNotice.title}
          description={gateNotice.description}
          action={
            <Link to={coursesGate ? "/profile" : "/tutor"} className="text-sm font-semibold text-sage hover:underline">
              {coursesGate ? "Go to Profile" : "Go to Tutor"}
            </Link>
          }
        />
      </Card>
    );
  }

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

      <BuildSessionDrawer open={buildOpen} onClose={() => setBuildOpen(false)} availableSubjects={availableSubjects} />

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
