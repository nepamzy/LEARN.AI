import { Link } from "react-router-dom";
import { CalendarCheck } from "lucide-react";
import { assignments, getSubject } from "../../../lib/mockData";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { formatDate, daysUntil } from "../../../lib/utils";
import { AssignmentStatusTag } from "../../../components/ui/StatusTag";

export function UpcomingDeadlines() {
  const upcoming = assignments
    .filter((a) => a.status === "todo")
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate));

  return (
    <Card>
      <h3 className="font-bold text-ink text-[17px] mb-3">Upcoming deadlines</h3>
      {upcoming.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="size-6" aria-hidden="true" />}
          title="Nothing due right now"
          description="You're all caught up on assignments."
        />
      ) : (
        <ul className="space-y-3">
          {upcoming.map((a) => {
            const subject = getSubject(a.subjectId);
            const days = daysUntil(a.dueDate);
            return (
              <li key={a.id}>
                <Link to={`/assignments/${a.id}`} className="flex items-center gap-3 group">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] text-ink group-hover:text-sage-hover truncate">{a.title}</p>
                    <p className="text-xs text-ink-secondary mt-0.5">
                      {subject?.name} · Due {formatDate(a.dueDate)} ({days === 0 ? "today" : days === 1 ? "tomorrow" : `${days} days`})
                    </p>
                  </div>
                  <AssignmentStatusTag status={a.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
