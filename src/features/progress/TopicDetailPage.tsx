import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, CalendarClock, FileQuestion } from "lucide-react";
import { getTopic, getSubject, getMasteryForTopic } from "../../lib/mockData";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { MasteryTag } from "../../components/ui/StatusTag";
import { SkillBar } from "../../components/ui/Progress";
import { EmptyState } from "../../components/ui/EmptyState";
import { formatDate } from "../../lib/utils";

const trendConfig = {
  up: { icon: TrendingUp, label: "Improved since last week", classes: "text-success" },
  down: { icon: TrendingDown, label: "Dipped slightly recently", classes: "text-error" },
  flat: { icon: Minus, label: "Steady recently", classes: "text-ink-secondary" },
};

export function TopicDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const topic = id ? getTopic(id) : undefined;
  const mastery = id ? getMasteryForTopic(id) : undefined;

  if (!topic) {
    return (
      <Card>
        <EmptyState icon={<FileQuestion className="size-6" aria-hidden="true" />} title="Topic not found" />
      </Card>
    );
  }

  const subject = getSubject(topic.subjectId);

  if (!mastery) {
    return (
      <div className="pb-6 pt-2 max-w-lg space-y-4">
        <BackLink />
        <Card>
          <EmptyState
            icon={<FileQuestion className="size-6" aria-hidden="true" />}
            title="No data yet for this topic"
            description="Practice a few questions here and Astra will start tracking your progress."
            action={<Button onClick={() => navigate("/practice")}>Start practicing</Button>}
          />
        </Card>
      </div>
    );
  }

  const trend = trendConfig[mastery.trend];

  return (
    <div className="pb-6 pt-2 space-y-4 max-w-lg">
      <BackLink />

      <div>
        <p className="text-sm font-semibold text-ink-secondary">{subject?.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <h2 className="text-xl font-bold text-ink">{topic.name}</h2>
          <MasteryTag status={mastery.status} />
        </div>
      </div>

      <Card>
        <h3 className="font-bold text-ink text-[15px] mb-2">Mastery trend</h3>
        <SkillBar value={mastery.masteryProbability * 100} tone={subject?.color === "amber" ? "amber" : "sage"} />
        <p className={`flex items-center gap-1.5 text-sm font-medium mt-2 ${trend.classes}`}>
          <trend.icon className="size-4" aria-hidden="true" /> {trend.label}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-2.5">
        <Card className="text-center">
          <p className="text-lg font-bold text-ink">{mastery.questionsAttempted}</p>
          <p className="text-xs text-ink-secondary">Questions attempted</p>
        </Card>
        <Card className="text-center">
          <p className="text-lg font-bold text-ink capitalize">{mastery.confidence}</p>
          <p className="text-xs text-ink-secondary">Confidence</p>
        </Card>
      </div>

      {mastery.nextReviewDue && (
        <Card className="flex items-center gap-3">
          <CalendarClock className="size-5 text-sage shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold text-ink text-[15px]">Next scheduled review</p>
            <p className="text-sm text-ink-secondary">{formatDate(mastery.nextReviewDue)}</p>
          </div>
        </Card>
      )}

      <Card className="bg-sage-surface border-sage/20">
        <h3 className="font-bold text-ink text-[15px] mb-2">Recommended action</h3>
        <p className="text-[15px] text-ink leading-relaxed">
          {mastery.status === "support"
            ? "Start with the basics again before attempting harder questions — a short tutor walkthrough will help."
            : mastery.status === "review"
              ? "A quick review session now will help this stay solid."
              : "Keep this topic in light rotation to maintain your strength."}
        </p>
        <div className="flex gap-2.5 mt-3">
          <Button size="sm" onClick={() => navigate("/practice")}>
            Practice this topic
          </Button>
          <Button size="sm" variant="secondary" onClick={() => navigate("/tutor")}>
            Ask Astra about it
          </Button>
        </div>
      </Card>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/progress" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-secondary hover:text-sage">
      <ArrowLeft className="size-4" aria-hidden="true" /> Progress
    </Link>
  );
}
