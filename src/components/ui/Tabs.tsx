import { cx } from "../../lib/utils";

interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  "aria-label": string;
}

export function Tabs({ tabs, active, onChange, ...props }: TabsProps) {
  return (
    <div role="tablist" aria-label={props["aria-label"]} className="flex gap-1 bg-[#F1F0EB] p-1 rounded-xl w-fit overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cx(
              "px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors duration-150",
              isActive ? "bg-surface text-ink shadow-soft" : "text-ink-secondary hover:text-ink"
            )}
          >
            {tab.label}
            {typeof tab.count === "number" && (
              <span className={cx("ml-1.5 text-xs", isActive ? "text-ink-secondary" : "text-ink-secondary/70")}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
