import { Link } from "react-router-dom";
import type { SubjectMastery } from "../../lib/types";
import { getSubject } from "../../lib/mockData";
import { Card } from "../ui/Card";
import { MasteryTag } from "../ui/StatusTag";
import { SubjectDot } from "../ui/SubjectDot";
import { ChevronRight } from "lucide-react";

export function SubjectMasteryCard({ mastery }: { mastery: SubjectMastery }) {
  const subject = getSubject(mastery.subjectId);
  if (!subject) return null;

  return (
    <Card interactive padded={false}>
      <Link to={`/progress?subject=${subject.id}`} className="flex items-center gap-3 p-4 sm:p-5">
        <SubjectDot color={subject.color} className="size-3" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink text-[15px] truncate">{subject.name}</p>
          <p className="text-xs text-ink-secondary mt-0.5 truncate">{mastery.nextRecommendation}</p>
        </div>
        <MasteryTag status={mastery.status} />
        <ChevronRight className="size-4 text-ink-secondary shrink-0" aria-hidden="true" />
      </Link>
    </Card>
  );
}
