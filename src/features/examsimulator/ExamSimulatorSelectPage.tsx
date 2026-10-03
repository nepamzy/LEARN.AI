import { useNavigate } from "react-router-dom";
import { examFormats } from "../../lib/examData";
import { Card } from "../../components/ui/Card";
import { ChevronRight } from "lucide-react";

export function ExamSimulatorSelectPage() {
  const navigate = useNavigate();

  return (
    <div className="pb-6 space-y-5 pt-2">
      <div>
        <h2 className="text-xl font-bold text-ink">Exam simulator</h2>
        <p className="text-[15px] text-ink-secondary mt-1">
          Practice under real exam conditions — timing, pacing, and format matched to the real thing.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {examFormats.map((f) => (
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
