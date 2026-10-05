import { useEffect, useState } from "react";
import { todayPlan, subjectMastery, insights, amara } from "../../lib/mockData";
import { effectiveEducationLevel, UNIVERSITY_COMING_SOON } from "../../lib/educationLevel";
import { GreetingHeader } from "./components/GreetingHeader";
import { NextBestStepCard } from "./components/NextBestStepCard";
import { TodaysPlanTimeline } from "./components/TodaysPlanTimeline";
import { ContinueCard } from "./components/ContinueCard";
import { UpcomingDeadlines } from "./components/UpcomingDeadlines";
import { AchievementsStrip } from "./components/AchievementsStrip";
import { OfflineContentBanner } from "./components/OfflineContentBanner";
import { SubjectMasteryCard } from "../../components/domain/SubjectMasteryCard";
import { InsightCard } from "../../components/domain/InsightCard";
import { ListSkeleton } from "../../components/ui/Skeleton";
import { Banner } from "../../components/ui/Banner";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { useAppState } from "../../state/useAppState";
import { WifiOff, Sparkles, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { loadLocal } from "../../lib/storage";

export function HomePage() {
  const { sync, prefs } = useAppState();
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const onboardingSkipped = loadLocal("onboardingSkipped", false);
  const level = effectiveEducationLevel(prefs.educationLevel, amara.educationLevel);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  function toggleTask(id: string) {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (loading) {
    return (
      <div className="pb-6 space-y-5">
        <ListSkeleton rows={4} />
      </div>
    );
  }

  // University: the dashboard below (today's plan, subject mastery, insights)
  // is entirely built from secondary-level subjects — showing it unfiltered
  // would be exactly the silent fallback to secondary content §6 forbids.
  if (level === "university") {
    return (
      <div className="pb-6 space-y-5">
        <GreetingHeader />
        <Card>
          <EmptyState
            icon={<GraduationCap className="size-6" aria-hidden="true" />}
            title={UNIVERSITY_COMING_SOON.title}
            description={UNIVERSITY_COMING_SOON.description}
          />
        </Card>
      </div>
    );
  }

  const nextTask = todayPlan.find((t) => t.urgency === "due-today" && !completedIds.has(t.id)) ?? todayPlan[0];
  const latestInsight = insights[0];

  return (
    <div className="pb-6 space-y-5">
      <GreetingHeader />

      {onboardingSkipped && (
        <Banner tone="amber" icon={<Sparkles className="size-4.5 shrink-0" aria-hidden="true" />}>
          Your setup isn't quite finished.{" "}
          <Link to="/profile" className="underline font-semibold">
            Pick up where you left off
          </Link>
        </Banner>
      )}

      {sync.status === "offline" && (
        <Banner tone="neutral" icon={<WifiOff className="size-4.5 shrink-0" aria-hidden="true" />}>
          You're offline. We'll sync your progress as soon as you're back online.
        </Banner>
      )}

      {nextTask && <NextBestStepCard task={nextTask} />}

      <TodaysPlanTimeline tasks={todayPlan} completedIds={completedIds} onToggle={toggleTask} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-ink text-[17px]">Your subjects</h3>
          <Link to="/progress" className="text-sm font-semibold text-sage hover:text-sage-hover">
            See all
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {subjectMastery.map((m) => (
            <SubjectMasteryCard key={m.subjectId} mastery={m} />
          ))}
        </div>
      </div>

      <ContinueCard />
      <UpcomingDeadlines />
      {latestInsight && <InsightCard insight={latestInsight} />}
      <AchievementsStrip />
      <OfflineContentBanner />
    </div>
  );
}
