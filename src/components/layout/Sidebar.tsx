import { NavLink } from "react-router-dom";
import { Compass } from "lucide-react";
import { primaryNav } from "./navConfig";
import { cx } from "../../lib/utils";
import { amara } from "../../lib/mockData";

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 border-r border-border bg-surface h-screen sticky top-0 px-4 py-6">
      <div className="flex items-center gap-2 px-2 mb-8">
        <span className="size-9 rounded-xl bg-sage flex items-center justify-center shrink-0">
          <Compass className="size-5 text-white" aria-hidden="true" />
        </span>
        <div>
          <p className="font-bold text-ink leading-tight">Astra Study</p>
          <p className="text-xs text-ink-secondary leading-tight">{amara.exam} companion</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1" aria-label="Main navigation">
        {primaryNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-semibold transition-colors duration-150",
                isActive ? "bg-sage-surface text-sage-hover" : "text-ink-secondary hover:bg-[#F3F2ED] hover:text-ink"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cx("size-5", isActive ? "text-sage" : "text-ink-secondary")} aria-hidden={true} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 rounded-xl bg-sage-surface">
        <p className="text-sm font-semibold text-sage-hover">{amara.name}</p>
        <p className="text-xs text-ink-secondary mt-0.5">Free plan · Upgrade for unlimited tutoring</p>
      </div>
    </aside>
  );
}
