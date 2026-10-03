import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer } from "../../../components/ui/Drawer";
import { Select, TextInput } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { subjects, topics } from "../../../lib/mockData";
import { amara } from "../../../lib/mockData";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function BuildSessionDrawer({ open, onClose }: Props) {
  const navigate = useNavigate();
  const availableSubjects = subjects.filter((s) => amara.subjects.includes(s.id));
  const [subjectId, setSubjectId] = useState(availableSubjects[0]?.id ?? "");
  const [topicId, setTopicId] = useState("any");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState("mixed");
  const [timed, setTimed] = useState(false);

  const subjectTopics = topics.filter((t) => t.subjectId === subjectId && !t.parentTopicId);

  function startSession() {
    onClose();
    navigate("/practice/session");
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Build my own session"
      footer={
        <Button fullWidth size="lg" onClick={startSession}>
          Start session
        </Button>
      }
    >
      <div className="space-y-4">
        <Select label="Subject" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setTopicId("any"); }}>
          {availableSubjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>

        <Select label="Topic" value={topicId} onChange={(e) => setTopicId(e.target.value)} hint="Choose a specific topic, or let Astra mix it up.">
          <option value="any">Any topic (recommended for you)</option>
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

        <Select label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="mixed">Mixed</option>
          <option value="easier">Easier — build confidence</option>
          <option value="harder">Harder — push myself</option>
        </Select>

        <label className="flex items-center gap-2.5 text-sm font-medium text-ink">
          <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} className="size-4 rounded accent-[#2F6B5B]" />
          Timed mode
        </label>
      </div>
    </Drawer>
  );
}
