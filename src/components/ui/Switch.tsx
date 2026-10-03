import { useId } from "react";
import { cx } from "../../lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}

export function Switch({ checked, onChange, label, description }: SwitchProps) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <div className="min-w-0">
        <label htmlFor={id} className="text-[15px] font-semibold text-ink cursor-pointer">
          {label}
        </label>
        {description && <p className="text-sm text-ink-secondary mt-0.5">{description}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative shrink-0 w-11 h-6 rounded-pill transition-colors duration-200",
          checked ? "bg-sage" : "bg-[#D8D5CB]"
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-soft transition-transform duration-200",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}
