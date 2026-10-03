import { useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Select, TextInput } from "../../../components/ui/Input";
import { StatusTag } from "../../../components/ui/StatusTag";
import { classes, heatmapTopics } from "../teacherData";
import { useToast } from "../../../components/ui/useToast";

export function CreateAssignmentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { show } = useToast();
  const [step, setStep] = useState(0);
  const [classId, setClassId] = useState(classes[0].id);
  const [topic, setTopic] = useState(heatmapTopics[0]);
  const [mix, setMix] = useState("mixed");
  const [dueDate, setDueDate] = useState("");

  function reset() {
    setStep(0);
    onClose();
  }

  function publish() {
    show(`Assignment on "${topic}" published to ${classes.find((c) => c.id === classId)?.name}.`, "success");
    reset();
  }

  return (
    <Modal open={open} onClose={reset} title="Create assignment" size="lg">
      {step === 0 && (
        <div className="space-y-4">
          <Select label="Class" value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select label="Syllabus topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
            {heatmapTopics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select label="Question mix" value={mix} onChange={(e) => setMix(e.target.value)}>
            <option value="objective">Objective only</option>
            <option value="theory">Theory only</option>
            <option value="mixed">Objective + theory</option>
            <option value="essay">Includes essay</option>
          </Select>
          <TextInput label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Button fullWidth onClick={() => setStep(1)} disabled={!dueDate}>
            Generate questions &amp; rubric
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-ink-secondary">
            Review the generated questions and rubric before publishing to students.
          </p>
          <div className="rounded-xl border border-border p-4 space-y-2">
            <p className="font-semibold text-ink text-[15px]">{topic} — mixed practice set</p>
            <p className="text-sm text-ink-secondary">6 objective questions, 2 short-answer, 1 brief written response.</p>
            <div className="flex gap-2 pt-1">
              <StatusTag tone="sage">Syllabus-aligned</StatusTag>
              <StatusTag tone="info">Auto-generated</StatusTag>
            </div>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="font-semibold text-ink text-[15px] mb-2">Rubric</p>
            <ul className="text-sm text-ink-secondary space-y-1">
              <li>Accuracy — 10 marks</li>
              <li>Method / working shown — 6 marks</li>
              <li>Written clarity — 4 marks</li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setStep(0)}>
              Back
            </Button>
            <Button fullWidth onClick={publish}>
              Publish to class
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
