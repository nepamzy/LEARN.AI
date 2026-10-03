import { NavLink } from "react-router-dom";
import { mobileNav } from "./navConfig";
import { cx } from "../../lib/utils";

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {mobileNav.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cx(
                  "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors duration-150",
                  isActive ? "text-sage" : "text-ink-secondary"
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
          </li>
        ))}
      </ul>
    </nav>
  );
}
