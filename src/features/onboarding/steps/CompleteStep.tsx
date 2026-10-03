import { CheckCircle2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import type { OnboardingData } from "../types";
import { getSubject } from "../../../lib/mockData";

interface Props {
  data: OnboardingData;
  onFinish: () => void;
}

export function CompleteStep({ data, onFinish }: Props) {
  const subjectNames = data.subjects.map((id) => getSubject(id)?.name).filter(Boolean);

  return (
    <div className="space-y-6 text-center">
      <span className="mx-auto size-16 rounded-2xl bg-sage-surface flex items-center justify-center">
        <CheckCircle2 className="size-8 text-sage" aria-hidden="true" />
      </span>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-ink">Your first study plan is ready.</h2>
        <p className="text-[15px] text-ink-secondary leading-relaxed">
          We've set up {data.exam ?? "your exam"} prep across {subjectNames.join(", ") || "your subjects"}.
          {data.diagnosticChoice === "done" &&
            ` Based on your quick check (${data.diagnosticCorrect}/${data.diagnosticTotal}), we've already placed a few topics into today's plan.`}
          {data.isUnderage && " We've sent a consent request to your parent or guardian — you can start exploring right away."}
        </p>
      </div>
      <Button size="lg" fullWidth onClick={onFinish}>
        Go to my dashboard
      </Button>
    </div>
  );
}
