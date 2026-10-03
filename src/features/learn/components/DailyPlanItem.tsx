import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, PencilLine, ClipboardList, Sparkles, MoreHorizontal, HelpCircle } from "lucide-react";
import type { PlanTask } from "../../../lib/types";
import { getSubject, getTopic } from "../../../lib/mockData";
import { Card } from "../../../components/ui/Card";
import { DueTag } from "../../../components/ui/StatusTag";
import { Button } from "../../../components/ui/Button";
import { minutesToLabel } from "../../../lib/utils";
import { useToast } from "../../../components/ui/Toast";

const kindIcon = {
  revision: BookOpen,
  practice: PencilLine,
  assignment: ClipboardList,
  "tutor-checkin": Sparkles,
};

const kindLabel: Record<PlanTask["kind"], string> = {
  revision: "Revision",
  practice: "Practice",
  assignment: "Assignment",
  "tutor-checkin": "Tutor check-in",
};

interface Props {
  task: PlanTask;
  onShowWhy: (task: PlanTask) => void;
}

export function DailyPlanItem({ task, onShowWhy }: Props) {
  const navigate = useNavigate();
  const { show } = useToast();
  const [expanded, setExpanded] = useState(false);
  const subject = getSubject(task.subjectId);
  const topic = task.topicId ? getTopic(task.topicId) : undefined;
  const Icon = kindIcon[task.kind];

  function start() {
    if (task.kind === "assignment") navigate("/assignments");
    else if (task.kind === "tutor-checkin") navigate("/tutor");
    else navigate("/practice/session");
  }

  function postpone() {
    show("Moved to tomorrow. A quick review now can help this stick, but tomorrow works too.", "info");
    setExpanded(false);
  }

  function swap() {
    show("Swapped for a similar task in this subject.", "info");
    setExpanded(false);
  }

  function notUnderstood() {
    show("No problem — we've queued a tutor explanation and a simpler version for later.", "info");
    setExpanded(false);
  }

  return (
    <Card padded={false}>
      <div className="p-4 flex items-center gap-3">
        <span className="size-9 rounded-lg bg-sage-surface text-sage flex items-center justify-center shrink-0">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] text-ink truncate">{task.title}</p>
          <p className="text-xs text-ink-secondary mt-0.5 truncate">
            {kindLabel[task.kind]} · {subject?.name}
            {topic ? ` · ${topic.name}` : ""} · {minutesToLabel(task.estimatedMinutes)}
          </p>
        </div>
        <DueTag urgency={task.urgency} />
        <button
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-label="More actions"
          className="size-8 flex items-center justify-center rounded-full text-ink-secondary hover:bg-sage-surface hover:text-sage transition-colors shrink-0"
        >
          <MoreHorizontal className="size-4.5" aria-hidden="true" />
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 flex flex-wrap gap-2 border-t border-border pt-3">
          <Button size="sm" onClick={start}>
            Start
          </Button>
          <Button size="sm" variant="secondary" onClick={postpone}>
            Postpone
          </Button>
          <Button size="sm" variant="secondary" onClick={swap}>
            Swap
          </Button>
          <Button size="sm" variant="secondary" onClick={notUnderstood}>
            I don't understand this
          </Button>
          <button
            onClick={() => onShowWhy(task)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-ink-secondary hover:text-sage px-2"
          >
            <HelpCircle className="size-4" aria-hidden="true" /> Why this?
          </button>
        </div>
      )}
    </Card>
  );
}
