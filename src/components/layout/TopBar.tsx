import { WifiOff, Gauge, Bell } from "lucide-react";
import { useAppState } from "../../state/useAppState";
import { Link } from "react-router-dom";

export function TopBar({ title }: { title?: string }) {
  const { sync, prefs } = useAppState();

  return (
    <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur-sm border-b border-border lg:border-none lg:bg-transparent">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 lg:py-5 content-max">
        <h1 className="text-[17px] lg:text-xl font-bold text-ink truncate">{title}</h1>
        <div className="flex items-center gap-2 shrink-0">
          {sync.status === "offline" && (
            <span
              className="flex items-center gap-1.5 text-xs font-semibold text-ink-secondary bg-[#F1F0EB] rounded-pill px-2.5 py-1"
              role="status"
            >
              <WifiOff className="size-3.5" aria-hidden="true" />
              Offline
            </span>
          )}
          {prefs.lowDataMode && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-info bg-info-surface rounded-pill px-2.5 py-1">
              <Gauge className="size-3.5" aria-hidden="true" />
              Low data
            </span>
          )}
          <Link
            to="/profile"
            aria-label="Notifications"
            className="size-9 flex items-center justify-center rounded-full text-ink-secondary hover:bg-sage-surface hover:text-sage transition-colors"
          >
            <Bell className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
