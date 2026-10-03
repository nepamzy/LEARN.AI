import { Link } from "react-router-dom";
import { Sparkles, UserRound, ChevronRight } from "lucide-react";
import type { Assignment } from "../../lib/types";
import { getSubject } from "../../lib/mockData";
import { Card } from "../ui/Card";
import { AssignmentStatusTag } from "../ui/StatusTag";
import { formatDate, minutesToLabel } from "../../lib/utils";

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const subject = getSubject(assignment.subjectId);
  const isReturned = assignment.status === "returned";
  const scoreDisplay = assignment.teacherOverride ? assignment.teacherOverride.adjustedScore : assignment.totalScore;

  return (
    <Card interactive padded={false}>
      <Link to={isReturned ? `/assignments/${assignment.id}/report` : `/assignments/${assignment.id}`} className="flex items-center gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-ink-secondary">{subject?.name}</span>
            <span className="text-ink-secondary/40">·</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-secondary">
              {assignment.source === "ai" ? <Sparkles className="size-3" aria-hidden="true" /> : <UserRound className="size-3" aria-hidden="true" />}
              {assignment.source === "ai" ? "AI-set" : "Teacher-set"}
            </span>
          </div>
          <p className="font-semibold text-[15px] text-ink truncate">{assignment.title}</p>
          <p className="text-xs text-ink-secondary mt-0.5">
            {isReturned
              ? `Scored ${scoreDisplay}/${assignment.maxScore}`
              : `Due ${formatDate(assignment.dueDate)} · ${minutesToLabel(assignment.estimatedMinutes)}`}
          </p>
        </div>
        <AssignmentStatusTag status={assignment.status} />
        <ChevronRight className="size-4 text-ink-secondary shrink-0" aria-hidden="true" />
      </Link>
    </Card>
  );
}
