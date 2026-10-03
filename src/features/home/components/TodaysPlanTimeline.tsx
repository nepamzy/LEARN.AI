import { Link } from "react-router-dom";
import { BookOpen, PencilLine, ClipboardList, Sparkles, Check } from "lucide-react";
import type { PlanTask } from "../../../lib/types";
import { getSubject } from "../../../lib/mockData";
import { Card } from "../../../components/ui/Card";
import { DueTag } from "../../../components/ui/StatusTag";
import { minutesToLabel } from "../../../lib/utils";
import { cx } from "../../../lib/utils";
import { EmptyState } from "../../../components/ui/EmptyState";
import { PartyPopper } from "lucide-react";

const kindIcon = {
  revision: BookOpen,
  practice: PencilLine,
  assignment: ClipboardList,
  "tutor-checkin": Sparkles,
};

interface Props {
  tasks: PlanTask[];
  completedIds: Set<string>;
  onToggle: (id: string) => void;
}

export function TodaysPlanTimeline({ tasks, completedIds, onToggle }: Props) {
  const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const allDone = tasks.length > 0 && tasks.every((t) => completedIds.has(t.id));

  if (tasks.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<PartyPopper className="size-6" aria-hidden="true" />}
          title="Nothing scheduled for today"
          description="Build your own session, or check back tomorrow for your next plan."
          action={
            <Link to="/learn" className="text-sm font-semibold text-sage hover:text-sage-hover">
              Build a session
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-ink text-[17px]">Today's plan</h3>
        <span className="text-sm text-ink-secondary">{tasks.length} tasks · about {minutesToLabel(totalMinutes)}</span>
      </div>

      {allDone ? (
        <EmptyState
          icon={<Check className="size-6" aria-hidden="true" />}
          title="You've completed today's plan."
          description="Nice work staying consistent. Feel free to stop here, or visit Review today for extra practice."
          action={
            <Link to="/revision" className="text-sm font-semibold text-sage hover:text-sage-hover">
              Go to Review today
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {tasks.map((task) => {
            const subject = getSubject(task.subjectId);
            const Icon = kindIcon[task.kind];
            const done = completedIds.has(task.id);
            return (
              <li key={task.id} className="flex items-center gap-3">
                <button
                  onClick={() => onToggle(task.id)}
                  aria-pressed={done}
                  aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
                  className={cx(
                    "size-6 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-150",
                    done ? "bg-sage border-sage" : "border-border-strong hover:border-sage"
                  )}
                >
                  {done && <Check className="size-3.5 text-white" aria-hidden="true" />}
                </button>
                <span className="size-8 rounded-lg bg-sage-surface text-sage flex items-center justify-center shrink-0">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cx("font-semibold text-[15px] text-ink truncate", done && "line-through text-ink-secondary")}>
                    {task.title}
                  </p>
                  <p className="text-xs text-ink-secondary truncate">
                    {subject?.name} · {minutesToLabel(task.estimatedMinutes)}
                  </p>
                </div>
                <DueTag urgency={task.urgency} />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
