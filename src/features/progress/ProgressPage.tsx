import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { subjects, subjectMastery, masteryRecords, insights, amara } from "../../lib/mockData";
import { ReadinessCard } from "./components/ReadinessCard";
import { MasteryMapSection } from "./components/MasteryMapSection";
import { SubjectMasteryCard } from "../../components/domain/SubjectMasteryCard";
import { InsightCard } from "../../components/domain/InsightCard";
import { Select } from "../../components/ui/Input";

export function ProgressPage() {
  const [params] = useSearchParams();
  const [subjectFilter, setSubjectFilter] = useState(params.get("subject") ?? "all");
  const [period, setPeriod] = useState("30d");

  const availableSubjects = subjects.filter((s) => amara.subjects.includes(s.id));
  const avgMastery = useMemo(
    () => Math.round((masteryRecords.reduce((s, m) => s + m.masteryProbability, 0) / masteryRecords.length) * 100),
    []
  );

  const visibleSubjects = subjectFilter === "all" ? availableSubjects : availableSubjects.filter((s) => s.id === subjectFilter);

  return (
    <div className="pb-6 space-y-5 pt-2">
      <div>
        <h2 className="text-xl font-bold text-ink">Progress</h2>
        <p className="text-[15px] text-ink-secondary mt-1">A clear picture of what's solid, and what needs a bit more time.</p>
      </div>

      <ReadinessCard pct={avgMastery} />

      <div className="flex gap-2.5">
        <div className="flex-1">
          <Select label="Subject" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            <option value="all">All subjects</option>
            {availableSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex-1">
          <Select label="Time period" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">Since you started</option>
          </Select>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-ink text-[17px] mb-3">Subjects at a glance</h3>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {subjectMastery
            .filter((m) => visibleSubjects.some((s) => s.id === m.subjectId))
            .map((m) => (
              <SubjectMasteryCard key={m.subjectId} mastery={m} />
            ))}
        </div>
      </div>

      {insights.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="font-bold text-ink text-[17px]">Astra's insights</h3>
          {insights.map((i) => (
            <InsightCard key={i.id} insight={i} />
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-bold text-ink text-[17px]">Mastery map</h3>
        {visibleSubjects.map((s) => (
          <MasteryMapSection key={s.id} subject={s} />
        ))}
      </div>
    </div>
  );
}
