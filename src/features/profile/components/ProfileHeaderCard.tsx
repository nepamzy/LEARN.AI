import { amara, getSubject } from "../../../lib/mockData";
import { Card } from "../../../components/ui/Card";
import { StatusTag } from "../../../components/ui/StatusTag";
import { SubjectDot } from "../../../components/ui/SubjectDot";
import { formatDate } from "../../../lib/utils";

export function ProfileHeaderCard() {
  return (
    <Card className="flex items-start gap-4">
      <span className="size-14 rounded-full bg-sage text-white flex items-center justify-center text-lg font-bold shrink-0">
        {amara.avatarInitials}
      </span>
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-bold text-ink">{amara.name}</h2>
        <p className="text-sm text-ink-secondary">
          {amara.exam} · Exam date {formatDate(amara.examDate, { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {amara.subjects.map((id) => {
            const s = getSubject(id);
            return s ? (
              <span key={id} className="inline-flex items-center gap-1 text-xs font-medium text-ink-secondary bg-[#F1F0EB] rounded-pill px-2 py-1">
                <SubjectDot color={s.color} className="size-1.5" /> {s.name}
              </span>
            ) : null;
          })}
        </div>
      </div>
      <StatusTag tone={amara.plan === "free" ? "neutral" : "sage"}>{amara.plan === "free" ? "Free plan" : "Premium"}</StatusTag>
    </Card>
  );
}
