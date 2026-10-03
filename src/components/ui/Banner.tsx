import type { ReactNode } from "react";
import { cx } from "../../lib/utils";

type BannerTone = "info" | "amber" | "neutral" | "error";

const toneClasses: Record<BannerTone, string> = {
  info: "bg-info-surface text-info border-info/15",
  amber: "bg-amber-surface text-amber border-amber/15",
  neutral: "bg-[#F1F0EB] text-ink-secondary border-border",
  error: "bg-error-surface text-error border-error/15",
};

interface BannerProps {
  tone?: BannerTone;
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Banner({ tone = "neutral", icon, children, action, className }: BannerProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx("flex items-center gap-3 rounded-xl border px-4 py-3 text-[14px] font-medium", toneClasses[tone], className)}
    >
      {icon}
      <span className="flex-1">{children}</span>
      {action}
    </div>
  );
}
