import { useNavigate } from "react-router-dom";
import { examFormats } from "../../lib/examData";
import { amara } from "../../lib/mockData";
import { allowedExamsForLevel, effectiveEducationLevel } from "../../lib/educationLevel";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ChevronRight, GraduationCap } from "lucide-react";
import { useAppState } from "../../state/useAppState";

// Phase 7b: distinct from UNIVERSITY_COMING_SOON — tutoring and assignments
// ARE built for university now, so that copy would be false here. There's
// just no standardized, timed exam format (no JAMB/WAEC/NECO equivalent) for
// an arbitrary university course to simulate, so this page genuinely has
// nothing to offer a university student, unlike Tutor/Assignments.
const EXAM_SIMULATOR_UNIVERSITY_NOTICE = {
  title: "No exam simulator for your courses",
  description:
    "University courses don't have one standardized, timed exam format the way WAEC or JAMB do, so there's nothing to simulate here. Ask Astra about your coursework in the Tutor tab, or request a practice assignment instead.",
};

export function ExamSimulatorSelectPage() {
  const navigate = useNavigate();
  const { prefs } = useAppState();
  const level = effectiveEducationLevel(prefs.educationLevel, amara.educationLevel);

  if (level === "university") {
    return (
      <Card>
        <EmptyState
          icon={<GraduationCap className="size-6" aria-hidden="true" />}
          title={EXAM_SIMULATOR_UNIVERSITY_NOTICE.title}
          description={EXAM_SIMULATOR_UNIVERSITY_NOTICE.description}
        />
      </Card>
    );
  }

  // Only the exams valid for this student's level — never shows Primary
  // material to a Senior Secondary student or vice versa.
  const availableFormats = examFormats.filter((f) => allowedExamsForLevel(level).includes(f.exam));

  return (
    <div className="pb-6 space-y-5 pt-2">
      <div>
        <h2 className="text-xl font-bold text-ink">Exam simulator</h2>
        <p className="text-[15px] text-ink-secondary mt-1">
          Practice under real exam conditions — timing, pacing, and format matched to the real thing.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {availableFormats.map((f) => (
          <Card
            key={f.exam}
            interactive
            padded={false}
            onClick={() => navigate("/exam/setup", { state: { exam: f.exam } })}
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-ink text-[17px]">{f.exam}</h3>
                <ChevronRight className="size-4 text-ink-secondary" aria-hidden="true" />
              </div>
              <dl className="mt-2 space-y-1 text-sm">
                <div className="flex gap-1.5">
                  <dt className="text-ink-secondary">Format:</dt>
                  <dd className="text-ink font-medium">{f.format}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-ink-secondary">Duration:</dt>
                  <dd className="text-ink font-medium">{f.duration}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-ink-secondary">Subjects:</dt>
                  <dd className="text-ink font-medium">{f.subjects}</dd>
                </div>
              </dl>
              <p className="text-xs text-ink-secondary mt-3 pt-3 border-t border-border">Best for: {f.bestFor}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
