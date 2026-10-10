import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, GraduationCap } from "lucide-react";
import { assignments, amara } from "../../lib/mockData";
import { effectiveEducationLevel, UNIVERSITY_NO_COURSES } from "../../lib/educationLevel";
import { Tabs } from "../../components/ui/Tabs";
import { AssignmentCard } from "../../components/domain/AssignmentCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { Card } from "../../components/ui/Card";
import { useAppState } from "../../state/useAppState";
import type { AssignmentStatus } from "../../lib/types";
import { UniversityAssignmentWorkspace } from "./UniversityAssignmentWorkspace";

const TAB_STATUS: Record<string, AssignmentStatus[]> = {
  todo: ["todo", "overdue"],
  submitted: ["submitted"],
  returned: ["returned"],
};

// Every current mock assignment is secondary-exam-flavoured (one names
// JAMB/WAEC explicitly) — there's no real Primary/Junior-Secondary/University
// assignment content to show honestly yet (§6/§9: don't fabricate it), so
// only Senior Secondary sees the existing assignment list, unchanged.
const ASSIGNMENTS_COMING_SOON = {
  title: "Assignments for your level are coming soon",
  description: "Astra Study's assignment content is built for Senior Secondary today. We'll let you know as soon as more is ready for your level.",
};

export function AssignmentsPage() {
  const [tab, setTab] = useState("todo");
  const { prefs } = useAppState();
  const level = effectiveEducationLevel(prefs.educationLevel, amara.educationLevel);
  const universityCourses = prefs.universityProfile?.courses ?? [];

  // Phase 7b: University now gets a real, AI-generated-per-request assignment
  // flow (§6) — a genuinely course-less university account falls back to a
  // notice instead of a workspace with nothing to scope to. Phase 7c §1a:
  // this is reachable now (Profile can remove every course), so it's an
  // actionable prompt back to Profile, not "coming soon".
  if (level === "university") {
    if (universityCourses.length === 0) {
      return (
        <Card>
          <EmptyState
            icon={<GraduationCap className="size-6" aria-hidden="true" />}
            title={UNIVERSITY_NO_COURSES.title}
            description={UNIVERSITY_NO_COURSES.description}
            action={
              <Link to="/profile" className="text-sm font-semibold text-sage hover:underline">
                Go to Profile
              </Link>
            }
          />
        </Card>
      );
    }
    return <UniversityAssignmentWorkspace courses={universityCourses} />;
  }

  if (level !== "senior-secondary") {
    return (
      <Card>
        <EmptyState icon={<GraduationCap className="size-6" aria-hidden="true" />} title={ASSIGNMENTS_COMING_SOON.title} description={ASSIGNMENTS_COMING_SOON.description} />
      </Card>
    );
  }

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
