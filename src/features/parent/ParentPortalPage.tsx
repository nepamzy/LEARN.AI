import { Download, Lock, CalendarClock } from "lucide-react";
import { parentChildren, subjectMastery, amara, assignments, todayStudyMinutes } from "../../lib/mockData";
import { getSubject } from "../../lib/mockData";
import { Card } from "../../components/ui/Card";
import { MasteryTag } from "../../components/ui/StatusTag";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { Banner } from "../../components/ui/Banner";
import { formatDate, minutesToLabel } from "../../lib/utils";
import { useToast } from "../../components/ui/useToast";

export function ParentPortalPage() {
  const { show } = useToast();
  const child = parentChildren[0];
  const upcoming = assignments.filter((a) => a.status === "todo");

  return (
    <div className="pb-6 space-y-5 pt-2 max-w-2xl">
      <Banner tone="neutral" icon={<Lock className="size-4 shrink-0" aria-hidden="true" />}>
        Preview of the parent portal. Tutor conversations stay private to {child.name} by default.
      </Banner>

      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink">Parent portal</h2>
          <p className="text-[15px] text-ink-secondary mt-1">A read-only view of {child.name}'s progress.</p>
        </div>
        <div className="w-44">
          <Select label="Viewing" value={child.id} onChange={() => {}}>
            <option value={child.id}>{child.name}</option>
          </Select>
        </div>
      </div>

      <Card>
        <h3 className="font-bold text-ink text-[16px] mb-3">This week</h3>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="text-center">
            <p className="text-lg font-bold text-ink">{minutesToLabel(amara.weeklyGoalMinutesDone)}</p>
            <p className="text-xs text-ink-secondary">Time studied</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-ink">12</p>
            <p className="text-xs text-ink-secondary">Tasks completed</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-ink">{minutesToLabel(todayStudyMinutes)}</p>
            <p className="text-xs text-ink-secondary">Today</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-ink text-[16px] mb-3">Strengths &amp; areas needing support</h3>
        <ul className="space-y-2.5">
          {subjectMastery.map((m) => (
            <li key={m.subjectId} className="flex items-center justify-between">
              <p className="font-medium text-[15px] text-ink">{getSubject(m.subjectId)?.name}</p>
              <MasteryTag status={m.status} />
            </li>
          ))}
        </ul>
      </Card>

      <Card className="bg-sage-surface border-sage/20">
        <h3 className="font-bold text-ink text-[16px] mb-1.5">Suggested next step</h3>
        <p className="text-[15px] text-ink leading-relaxed">
          Ask {child.name} about Chemistry: Stoichiometry — it's their newest focus area, and a bit of encouragement
          at home goes a long way this week.
        </p>
      </Card>

      <Card>
        <h3 className="font-bold text-ink text-[16px] mb-3">Upcoming dates</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-ink-secondary">Nothing due right now.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-[15px]">
                <span className="flex items-center gap-2 text-ink">
                  <CalendarClock className="size-4 text-ink-secondary" aria-hidden="true" /> {a.title}
                </span>
                <span className="text-ink-secondary">{formatDate(a.dueDate)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Button variant="secondary" fullWidth onClick={() => show("Weekly report PDF is being prepared.", "success")}>
        <Download className="size-4" aria-hidden="true" /> Download this week's report
      </Button>
    </div>
  );
}
