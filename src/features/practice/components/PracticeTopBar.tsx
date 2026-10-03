import { X, Clock, Flag, CheckCircle2 } from "lucide-react";
import { LinearProgress } from "../../../components/ui/Progress";

interface Props {
  subjectName: string;
  topicName?: string;
  questionIndex: number;
  questionCount: number;
  timed: boolean;
  secondsLeft?: number;
  onExit: () => void;
}

function formatClock(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function PracticeTopBar({ subjectName, topicName, questionIndex, questionCount, timed, secondsLeft, onExit }: Props) {
  return (
    <div className="sticky top-0 bg-bg z-10 pb-3 pt-4 px-4 sm:px-6">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={onExit}
          aria-label="Exit practice session"
          className="size-9 flex items-center justify-center rounded-full text-ink-secondary hover:bg-sage-surface hover:text-sage transition-colors shrink-0"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink truncate">
            {subjectName}
            {topicName ? ` · ${topicName}` : ""}
          </p>
        </div>
        {timed && typeof secondsLeft === "number" && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-amber shrink-0">
            <Clock className="size-4" aria-hidden="true" /> {formatClock(secondsLeft)}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs font-medium text-ink-secondary shrink-0" title="Progress saved">
          <CheckCircle2 className="size-4" aria-hidden="true" />
        </span>
      </div>
      <LinearProgress
        value={((questionIndex) / questionCount) * 100}
        label={`Question ${questionIndex + 1} of ${questionCount}`}
      />
    </div>
  );
}

export { Flag };
