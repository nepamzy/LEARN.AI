import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ExamType } from "../../lib/types";
import { subjects, amara } from "../../lib/mockData";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import { SubjectDot } from "../../components/ui/SubjectDot";
import { cx } from "../../lib/utils";

export function ExamSimulatorSetupPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const exam: ExamType = (state as { exam?: ExamType })?.exam ?? "JAMB";

  const availableSubjects = subjects.filter((s) => amara.subjects.includes(s.id));
  const [selected, setSelected] = useState<string[]>(availableSubjects.map((s) => s.id));
  const [duration, setDuration] = useState("40");
  const [difficulty, setDifficulty] = useState("mixed");
  const [examCondition, setExamCondition] = useState(true);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  return (
    <div className="pb-6 space-y-5 pt-2 max-w-lg">
      <div>
        <h2 className="text-xl font-bold text-ink">Set up your {exam} mock</h2>
        <p className="text-[15px] text-ink-secondary mt-1">Choose your subjects and timing before you begin.</p>
      </div>

      <Card>
        <p className="text-sm font-semibold text-ink mb-2.5">Subjects</p>
        <ul className="space-y-2">
          {availableSubjects.map((s) => {
            const isSelected = selected.includes(s.id);
            return (
              <li key={s.id}>
                <button
                  role="checkbox"
                  aria-checked={isSelected}
                  onClick={() => toggle(s.id)}
                  className={cx(
                    "w-full flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors duration-150",
                    isSelected ? "border-sage bg-sage-surface" : "border-border-strong bg-surface"
                  )}
                >
                  <SubjectDot color={s.color} />
                  <span className="flex-1 text-left font-medium text-[15px] text-ink">{s.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="space-y-4">
        <Select label="Duration per subject (minutes)" value={duration} onChange={(e) => setDuration(e.target.value)}>
          <option value="20">20 minutes</option>
          <option value="40">40 minutes</option>
          <option value="60">60 minutes</option>
        </Select>
        <Select label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="mixed">Mixed (recommended)</option>
          <option value="standard">Standard exam level</option>
          <option value="challenge">Challenge</option>
        </Select>
        <label className="flex items-start gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={examCondition}
            onChange={(e) => setExamCondition(e.target.checked)}
            className="size-4 rounded accent-[#2F6B5B] mt-0.5"
          />
          <span>
            <span className="font-semibold">Exam-condition mode</span>
            <br />
            <span className="text-ink-secondary text-[13px]">No hints, no immediate feedback, full timing — just like the real thing.</span>
          </span>
        </label>
      </Card>

      <Button
        size="lg"
        fullWidth
        disabled={selected.length === 0}
        onClick={() => navigate("/exam/intro", { state: { exam, subjects: selected, duration, examCondition } })}
      >
        Continue
      </Button>
    </div>
  );
}
