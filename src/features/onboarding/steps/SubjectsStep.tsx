import { subjects } from "../../../lib/mockData";
import { Button } from "../../../components/ui/Button";
import { SubjectDot } from "../../../components/ui/SubjectDot";
import { cx } from "../../../lib/utils";
import { Check } from "lucide-react";

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
  onNext: () => void;
  error?: string;
}

export function SubjectsStep({ value, onChange, onNext, error }: Props) {
  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((s) => s !== id) : [...value, id]);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-ink">Which subjects are you focusing on?</h2>
        <p className="text-[15px] text-ink-secondary">Pick at least one — you can add more later.</p>
      </div>

      <ul className="space-y-2" aria-label="Select subjects">
        {subjects.map((s) => {
          const selected = value.includes(s.id);
          return (
            <li key={s.id}>
              <button
                role="checkbox"
                aria-checked={selected}
                onClick={() => toggle(s.id)}
                className={cx(
                  "w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors duration-150",
                  selected ? "border-sage bg-sage-surface" : "border-border-strong bg-surface hover:border-sage/50"
                )}
              >
                <SubjectDot color={s.color} />
                <span className="flex-1 text-left font-semibold text-[15px] text-ink">{s.name}</span>
                {selected && <Check className="size-5 text-sage" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>
      {error && <p className="text-sm text-error font-medium" role="alert">{error}</p>}

      <Button size="lg" fullWidth onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}
