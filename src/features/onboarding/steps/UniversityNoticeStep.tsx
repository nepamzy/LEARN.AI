import { GraduationCap } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { UNIVERSITY_COMING_SOON } from "../../../lib/educationLevel";

// Shown at the point ExamStep/SubjectsStep would otherwise appear, for a
// University selection (§6: honest, not fabricated — no fake courses).
// Account setup still completes; only exam-prep-specific content is deferred.
export function UniversityNoticeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <span className="mx-auto size-16 rounded-2xl bg-sage-surface flex items-center justify-center">
        <GraduationCap className="size-8 text-sage" aria-hidden="true" />
      </span>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-ink">{UNIVERSITY_COMING_SOON.title}</h2>
        <p className="text-[15px] text-ink-secondary leading-relaxed">{UNIVERSITY_COMING_SOON.description}</p>
      </div>
      <Button size="lg" fullWidth onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}
