import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PencilLine, Timer, GraduationCap } from "lucide-react";
import { amara, topics } from "../../lib/mockData";
import { effectiveEducationLevel } from "../../lib/educationLevel";
import { availableSubjectsForLevel, universityContentGateNotice } from "../../lib/levelContent";
import { Card } from "../../components/ui/Card";
import { Select, TextInput } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { cx } from "../../lib/utils";
import { useAppState } from "../../state/useAppState";

export function PracticeSetupPage() {
  const navigate = useNavigate();
  const { prefs } = useAppState();
  const level = effectiveEducationLevel(prefs.educationLevel, amara.educationLevel);
  const universityCourses = prefs.universityProfile?.courses ?? [];
  // Phase 7c §1c: scoped to this level's own subjects — previously every
  // level saw Amara's full subject list regardless of their own choice.
  const availableSubjects = availableSubjectsForLevel(level, universityCourses);
  const gateNotice = level === "university" ? universityContentGateNotice(universityCourses) : null;
  const [subjectId, setSubjectId] = useState(availableSubjects[0]?.id ?? "");
  const [topicId, setTopicId] = useState("any");
  const [count, setCount] = useState(10);
  const [timed, setTimed] = useState(false);
  const [mode, setMode] = useState<"learning" | "serious">("learning");

  const subjectTopics = topics.filter((t) => t.subjectId === subjectId && !t.parentTopicId);

  function startSession() {
    navigate("/practice/session", { state: { subjectId, mode, timed } });
  }

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

  return (
    <div className="pb-6 space-y-5 pt-2 max-w-lg">
      <div>
        <h2 className="text-xl font-bold text-ink">Set up your practice</h2>
        <p className="text-[15px] text-ink-secondary mt-1">
          Choose what to work on — Astra will mix in questions from topics you're due to review.
        </p>
      </div>

      <Card className="space-y-4">
        <Select label="Subject" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setTopicId("any"); }}>
          {availableSubjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>

        <Select label="Topic" value={topicId} onChange={(e) => setTopicId(e.target.value)} hint={'Leave on "any topic" to let Astra prioritise for you.'}>
          <option value="any">Any topic (recommended)</option>
          {subjectTopics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>

        <TextInput
          label="Number of questions"
          type="number"
          min={5}
          max={40}
          step={5}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />

        <label className="flex items-center gap-2.5 text-sm font-medium text-ink">
          <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} className="size-4 rounded accent-[#2F6B5B]" />
          Timed mode
        </label>
      </Card>

      <div>
        <p className="text-sm font-semibold text-ink mb-2">Mode</p>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => setMode("learning")}
            className={cx(
              "text-left rounded-xl border px-3.5 py-3 transition-colors duration-150",
              mode === "learning" ? "border-sage bg-sage-surface" : "border-border-strong bg-surface"
            )}
          >
            <PencilLine className="size-4.5 text-sage mb-1.5" aria-hidden="true" />
            <p className="font-semibold text-ink text-[15px]">Learning</p>
            <p className="text-xs text-ink-secondary mt-0.5">Feedback after every answer</p>
          </button>
          <button
            onClick={() => setMode("serious")}
            className={cx(
              "text-left rounded-xl border px-3.5 py-3 transition-colors duration-150",
              mode === "serious" ? "border-sage bg-sage-surface" : "border-border-strong bg-surface"
            )}
          >
            <GraduationCap className="size-4.5 text-sage mb-1.5" aria-hidden="true" />
            <p className="font-semibold text-ink text-[15px]">Mock-style</p>
            <p className="text-xs text-ink-secondary mt-0.5">Feedback only at the end</p>
          </button>
        </div>
      </div>

      <Button size="lg" fullWidth onClick={startSession}>
        <Timer className="size-4.5" aria-hidden="true" /> Start practice
      </Button>
    </div>
  );
}
