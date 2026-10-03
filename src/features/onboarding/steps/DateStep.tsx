import { useMemo } from "react";
import { CalendarX2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/Input";
import { todayISODate } from "../../../lib/dates";

interface Props {
  value: string;
  unknown: boolean;
  onChangeDate: (v: string) => void;
  onToggleUnknown: (v: boolean) => void;
  onNext: () => void;
  error?: string;
}

export function DateStep({ value, unknown, onChangeDate, onToggleUnknown, onNext, error }: Props) {
  const today = useMemo(() => todayISODate(), []);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-ink">When is your exam?</h2>
        <p className="text-[15px] text-ink-secondary">We'll use this to pace your study plan.</p>
      </div>

      {!unknown && (
        <TextInput
          label="Exam date"
          type="date"
          min={today}
          value={value}
          onChange={(e) => onChangeDate(e.target.value)}
          error={error}
        />
      )}

      {unknown && (
        <div className="flex items-start gap-3 rounded-xl border border-border-strong bg-[#F8F7F2] px-4 py-4">
          <CalendarX2 className="size-5 text-ink-secondary shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-ink-secondary">
            No problem — we'll start you on a steady, general pace and adjust automatically once you set a date.
          </p>
        </div>
      )}

      <label className="flex items-center gap-2.5 text-sm font-medium text-ink-secondary">
        <input
          type="checkbox"
          checked={unknown}
          onChange={(e) => onToggleUnknown(e.target.checked)}
          className="size-4 rounded accent-[#2F6B5B]"
        />
        I don't know my exam date yet
      </label>

      <Button size="lg" fullWidth onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}
