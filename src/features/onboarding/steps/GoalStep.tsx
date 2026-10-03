import type { StudyGoalPace } from "../../../lib/types";
import { Button } from "../../../components/ui/Button";
import { cx } from "../../../lib/utils";

const PACES: { id: StudyGoalPace; label: string; detail: string }[] = [
  { id: "light", label: "Light", detail: "~15 min a day · for a busy week" },
  { id: "steady", label: "Steady", detail: "~40 min a day · a sustainable rhythm" },
  { id: "ambitious", label: "Ambitious", detail: "~75 min a day · exam coming up soon" },
  { id: "custom", label: "Custom", detail: "Set your own weekly target" },
];

interface Props {
  value: StudyGoalPace;
  customMinutes: number;
  onChange: (v: StudyGoalPace) => void;
  onCustomMinutesChange: (v: number) => void;
  onNext: () => void;
}

export function GoalStep({ value, customMinutes, onChange, onCustomMinutesChange, onNext }: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-ink">What's a realistic weekly study goal?</h2>
        <p className="text-[15px] text-ink-secondary">Be honest — consistency beats intensity.</p>
      </div>

      <div role="radiogroup" aria-label="Weekly study goal" className="space-y-2.5">
        {PACES.map((p) => {
          const selected = value === p.id;
          return (
            <button
              key={p.id}
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(p.id)}
              className={cx(
                "w-full text-left rounded-xl border px-4 py-3 transition-colors duration-150",
                selected ? "border-sage bg-sage-surface" : "border-border-strong bg-surface hover:border-sage/50"
              )}
            >
              <p className="font-semibold text-ink text-[15px]">{p.label}</p>
              <p className="text-xs text-ink-secondary mt-0.5">{p.detail}</p>
            </button>
          );
        })}
      </div>

      {value === "custom" && (
        <div className="pl-1">
          <label htmlFor="custom-min" className="text-sm font-semibold text-ink">
            Weekly minutes target
          </label>
          <input
            id="custom-min"
            type="range"
            min={60}
            max={600}
            step={15}
            value={customMinutes}
            onChange={(e) => onCustomMinutesChange(Number(e.target.value))}
            className="w-full mt-2 accent-[#2F6B5B]"
          />
          <p className="text-sm text-ink-secondary mt-1">{customMinutes} minutes / week (~{Math.round(customMinutes / 7)} min/day)</p>
        </div>
      )}

      <Button size="lg" fullWidth onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}
