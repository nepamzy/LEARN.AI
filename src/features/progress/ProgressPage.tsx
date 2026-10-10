import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { subjectMastery, masteryRecords, insights, topics, amara } from "../../lib/mockData";
import { effectiveEducationLevel } from "../../lib/educationLevel";
import { availableSubjectsForLevel, universityContentGateNotice } from "../../lib/levelContent";
import { ReadinessCard } from "./components/ReadinessCard";
import { MasteryMapSection } from "./components/MasteryMapSection";
import { SubjectMasteryCard } from "../../components/domain/SubjectMasteryCard";
import { InsightCard } from "../../components/domain/InsightCard";
import { Select } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { useAppState } from "../../state/useAppState";

export function ProgressPage() {
  const [params] = useSearchParams();
  const [subjectFilter, setSubjectFilter] = useState(params.get("subject") ?? "all");
  const [period, setPeriod] = useState("30d");
  const { prefs } = useAppState();
  const level = effectiveEducationLevel(prefs.educationLevel, amara.educationLevel);
  const universityCourses = prefs.universityProfile?.courses ?? [];

  // Phase 7c §1c: subjects now come from the student's actual level, not
  // Amara's own baked-in list — for Senior Secondary this resolves to the
  // exact same four subjects Amara already has, so her experience here is
  // unchanged. University gets just the one pilot course, or an honest
  // notice (below) if it has none.
  const availableSubjects = availableSubjectsForLevel(level, universityCourses);
  const gateNotice = level === "university" ? universityContentGateNotice(universityCourses) : null;

  // Phase 7c §1c: scoped to this level's own subjects — previously this
  // averaged ALL mock mastery records (biology/chemistry included)
  // regardless of level, which would hand a Primary or Junior Secondary
  // student a readiness number partly built from topics they can't see.
  const visibleTopicIds = useMemo(
    () => new Set(topics.filter((t) => availableSubjects.some((s) => s.id === t.subjectId)).map((t) => t.id)),
    [availableSubjects]
  );
  const visibleMasteryRecords = masteryRecords.filter((m) => visibleTopicIds.has(m.topicId));
  const avgMastery =
    visibleMasteryRecords.length > 0
      ? Math.round((visibleMasteryRecords.reduce((s, m) => s + m.masteryProbability, 0) / visibleMasteryRecords.length) * 100)
      : 0;
  const visibleInsights = insights.filter((i) => availableSubjects.some((s) => s.id === i.subjectId));

  if (gateNotice) {
    return (
      <Card>
        <EmptyState
          icon={<GraduationCap className="size-6" aria-hidden="true" />}
          title={gateNotice.title}
          description={gateNotice.description}
          action={
            <Link to="/profile" className="text-sm font-semibold text-sage hover:underline">
              Go to Profile
            </Link>
          }
        />
      </Card>
    );
  }

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

      {visibleInsights.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="font-bold text-ink text-[17px]">Astra's insights</h3>
          {visibleInsights.map((i) => (
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
