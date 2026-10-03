import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { assignments } from "../../lib/mockData";
import { Tabs } from "../../components/ui/Tabs";
import { AssignmentCard } from "../../components/domain/AssignmentCard";
import { EmptyState } from "../../components/ui/EmptyState";
import type { AssignmentStatus } from "../../lib/types";

const TAB_STATUS: Record<string, AssignmentStatus[]> = {
  todo: ["todo", "overdue"],
  submitted: ["submitted"],
  returned: ["returned"],
};

export function AssignmentsPage() {
  const [tab, setTab] = useState("todo");
  const filtered = assignments.filter((a) => TAB_STATUS[tab].includes(a.status));

  return (
    <div className="pb-6 space-y-4 pt-2">
      <div>
        <h2 className="text-xl font-bold text-ink">Assignments</h2>
        <p className="text-[15px] text-ink-secondary mt-1">Work set by Astra and by your teachers, in one place.</p>
      </div>

      <Tabs
        aria-label="Filter assignments"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "todo", label: "To do", count: assignments.filter((a) => TAB_STATUS.todo.includes(a.status)).length },
          { id: "submitted", label: "Submitted", count: assignments.filter((a) => a.status === "submitted").length },
          { id: "returned", label: "Returned", count: assignments.filter((a) => a.status === "returned").length },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="size-6" aria-hidden="true" />}
          title={tab === "todo" ? "No assignments due" : tab === "submitted" ? "Nothing waiting to be marked" : "No returned work yet"}
          description={tab === "todo" ? "You're all caught up. New assignments will appear here." : undefined}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((a) => (
            <AssignmentCard key={a.id} assignment={a} />
          ))}
        </div>
      )}
    </div>
  );
}
