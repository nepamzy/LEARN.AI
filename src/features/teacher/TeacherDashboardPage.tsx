import { useState } from "react";
import { Plus, Users, ClipboardList, AlertTriangle, TrendingUp } from "lucide-react";
import { classes, students, heatmapTopics, reteachTopics } from "./teacherData";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { StatusTag } from "../../components/ui/StatusTag";
import { CreateAssignmentModal } from "./components/CreateAssignmentModal";

function heatColor(value: number) {
  if (value >= 75) return "bg-sage-surface text-sage-hover";
  if (value >= 55) return "bg-info-surface text-info";
  if (value >= 40) return "bg-amber-surface text-amber";
  return "bg-error-surface text-error";
}

export function TeacherDashboardPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const totalStudents = classes.reduce((s, c) => s + c.studentCount, 0);
  const totalToReview = classes.reduce((s, c) => s + c.assignmentsToReview, 0);
  const needingSupport = students.filter((s) => s.needsSupport).length;

  return (
    <div className="pb-10 space-y-5 pt-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink">School dashboard</h2>
          <p className="text-[15px] text-ink-secondary mt-1">Preview — classes, assignments, and mastery across your students.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden="true" /> Create assignment
        </Button>
      </div>

      <div className="grid sm:grid-cols-4 gap-2.5">
        <Card className="text-center">
          <Users className="size-5 text-sage mx-auto mb-1" aria-hidden="true" />
          <p className="text-lg font-bold text-ink">{totalStudents}</p>
          <p className="text-xs text-ink-secondary">Students</p>
        </Card>
        <Card className="text-center">
          <ClipboardList className="size-5 text-amber mx-auto mb-1" aria-hidden="true" />
          <p className="text-lg font-bold text-ink">{totalToReview}</p>
          <p className="text-xs text-ink-secondary">Assignments to review</p>
        </Card>
        <Card className="text-center">
          <AlertTriangle className="size-5 text-error mx-auto mb-1" aria-hidden="true" />
          <p className="text-lg font-bold text-ink">{needingSupport}</p>
          <p className="text-xs text-ink-secondary">Students needing support</p>
        </Card>
        <Card className="text-center">
          <TrendingUp className="size-5 text-info mx-auto mb-1" aria-hidden="true" />
          <p className="text-lg font-bold text-ink">67%</p>
          <p className="text-xs text-ink-secondary">Avg. mastery across classes</p>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold text-ink text-[16px] mb-3">Your classes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-secondary border-b border-border">
                <th className="py-2 pr-4 font-semibold">Class</th>
                <th className="py-2 pr-4 font-semibold">Students</th>
                <th className="py-2 pr-4 font-semibold">Avg. mastery</th>
                <th className="py-2 font-semibold">To review</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-ink">{c.name}</td>
                  <td className="py-2.5 pr-4 text-ink-secondary">{c.studentCount}</td>
                  <td className="py-2.5 pr-4 text-ink-secondary">{c.avgMastery}%</td>
                  <td className="py-2.5">
                    {c.assignmentsToReview > 0 ? (
                      <StatusTag tone="amber">{c.assignmentsToReview} pending</StatusTag>
                    ) : (
                      <StatusTag tone="sage">Up to date</StatusTag>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-ink text-[16px] mb-1">Student mastery heatmap — SS3 Science A</h3>
        <p className="text-sm text-ink-secondary mb-3">Darker amber/red cells need reteaching attention.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-ink-secondary pb-1">Student</th>
                {heatmapTopics.map((t) => (
                  <th key={t} className="text-xs font-semibold text-ink-secondary pb-1 px-1 text-center min-w-20">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="text-sm font-medium text-ink pr-2 whitespace-nowrap">{s.name}</td>
                  {heatmapTopics.map((t) => (
                    <td key={t} className="p-0.5">
                      <div className={`rounded-lg text-center text-xs font-semibold py-2 ${heatColor(s.mastery[t])}`}>
                        {s.mastery[t]}%
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="sr-only">Table showing each student's mastery percentage per topic, used to identify who needs support.</p>
      </Card>

      <Card className="border-amber/20 bg-amber-surface">
        <h3 className="font-bold text-ink text-[16px] mb-2">Topics flagged for reteaching</h3>
        <ul className="space-y-3">
          {reteachTopics.map((r) => (
            <li key={r.topic}>
              <p className="font-semibold text-ink text-[15px]">
                {r.topic} <span className="text-ink-secondary font-normal">· class avg {r.classAvg}%</span>
              </p>
              <p className="text-sm text-ink-secondary">{r.note}</p>
            </li>
          ))}
        </ul>
      </Card>

      <CreateAssignmentModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
