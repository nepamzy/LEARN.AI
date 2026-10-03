import { useMemo } from "react";
import { cx } from "../../../lib/utils";
import { getStartOfToday } from "../../../lib/dates";

interface DayInfo {
  date: Date;
  taskCount: number;
}

interface Props {
  days: DayInfo[];
  selectedIndex: number;
  onSelect: (i: number) => void;
}

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export function WeekStrip({ days, selectedIndex, onSelect }: Props) {
  const today = useMemo(() => getStartOfToday(), []);

  return (
    <div role="tablist" aria-label="Select a day" className="grid grid-cols-7 gap-1.5">
      {days.map((d, i) => {
        const isSelected = i === selectedIndex;
        const isToday = d.date.getTime() === today.getTime();
        return (
          <button
            key={i}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(i)}
            className={cx(
              "flex flex-col items-center gap-1 rounded-xl py-2.5 transition-colors duration-150",
              isSelected ? "bg-sage text-white" : "bg-surface border border-border text-ink hover:border-sage/50"
            )}
          >
            <span className={cx("text-[11px] font-semibold", isSelected ? "text-white/80" : "text-ink-secondary")}>
              {DOW[d.date.getDay()]}
            </span>
            <span className="text-[15px] font-bold">{d.date.getDate()}</span>
            {isToday && !isSelected && <span className="size-1.5 rounded-full bg-amber" aria-label="Today" />}
            {d.taskCount > 0 && isSelected && (
              <span className="text-[10px] font-semibold text-white/80">{d.taskCount}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
