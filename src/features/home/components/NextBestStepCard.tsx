import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, HelpCircle } from "lucide-react";
import type { PlanTask } from "../../../lib/types";
import { getSubject } from "../../../lib/mockData";
import { Button } from "../../../components/ui/Button";
import { SubjectDot } from "../../../components/ui/SubjectDot";
import { minutesToLabel } from "../../../lib/utils";
import { Drawer } from "../../../components/ui/Drawer";

export function NextBestStepCard({ task }: { task: PlanTask }) {
  const navigate = useNavigate();
  const [whyOpen, setWhyOpen] = useState(false);
  const subject = getSubject(task.subjectId);

  function start() {
    if (task.kind === "practice" || task.kind === "revision") navigate("/practice/session");
    else if (task.kind === "assignment") navigate("/assignments");
    else navigate("/tutor");
  }

  return (
    <div className="rounded-card-lg bg-sage text-white p-5 sm:p-6 relative overflow-hidden">
      <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/5" aria-hidden="true" />
      <p className="text-[13px] font-semibold uppercase tracking-wide text-white/75 mb-2">Your next best step</p>
      <div className="flex items-center gap-2 mb-1.5">
        {subject && <SubjectDot color="sage" className="bg-white" />}
        <span className="text-sm font-semibold text-white/90">{subject?.name}</span>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold leading-snug mb-2">{task.title}</h3>
      <p className="text-[15px] text-white/85 leading-relaxed mb-5">{task.reason} · {minutesToLabel(task.estimatedMinutes)}</p>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="lg"
          onClick={start}
          className="!bg-white !text-sage-hover !border-white hover:!bg-white/90"
        >
          Start now <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
        <button
          onClick={() => setWhyOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 hover:text-white px-3 py-2"
        >
          <HelpCircle className="size-4" aria-hidden="true" />
          Why this?
        </button>
      </div>

      <Drawer open={whyOpen} onClose={() => setWhyOpen(false)} title="Why am I seeing this?">
        <p>
          This topic is scheduled for review today because our spaced-repetition system estimates your memory of it
          is starting to fade — reviewing now, while it's still fresh enough, helps it stick for longer with less
          future effort than waiting until you've forgotten it completely.
        </p>
        <p className="mt-3 text-ink-secondary">
          We also factor in how often you've gotten similar questions right recently, and how close your exam date is.
        </p>
      </Drawer>
    </div>
  );
}
