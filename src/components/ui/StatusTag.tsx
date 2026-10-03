import type { ReactNode } from "react";
import {
  TrendingUp,
  Hammer,
  Clock,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FileCheck2,
  WifiOff,
  RefreshCw,
  CircleDot,
} from "lucide-react";
import { cx } from "../../lib/utils";
import type { MasteryStatus } from "../../lib/types";

export type TagTone = "sage" | "amber" | "info" | "error" | "neutral" | "success";

const toneClasses: Record<TagTone, string> = {
  sage: "bg-sage-surface text-sage-hover",
  amber: "bg-amber-surface text-amber",
  info: "bg-info-surface text-info",
  error: "bg-error-surface text-error",
  success: "bg-success-surface text-success",
  neutral: "bg-[#F1F0EB] text-ink-secondary",
};

interface StatusTagProps {
  tone: TagTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function StatusTag({ tone, icon, children, className }: StatusTagProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[13px] font-semibold leading-none",
        toneClasses[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

const masteryConfig: Record<MasteryStatus, { label: string; tone: TagTone; icon: ReactNode }> = {
  strong: { label: "Strong", tone: "sage", icon: <TrendingUp className="size-3.5" aria-hidden="true" /> },
  building: { label: "Building", tone: "info", icon: <Hammer className="size-3.5" aria-hidden="true" /> },
  review: { label: "Review soon", tone: "amber", icon: <Clock className="size-3.5" aria-hidden="true" /> },
  support: { label: "Needs support", tone: "error", icon: <AlertTriangle className="size-3.5" aria-hidden="true" /> },
};

export function MasteryTag({ status, className }: { status: MasteryStatus; className?: string }) {
  const cfg = masteryConfig[status];
  return (
    <StatusTag tone={cfg.tone} icon={cfg.icon} className={className}>
      {cfg.label}
    </StatusTag>
  );
}

export function DueTag({ urgency }: { urgency: "due-today" | "upcoming" | "overdue" }) {
  if (urgency === "overdue") {
    return (
      <StatusTag tone="error" icon={<AlertTriangle className="size-3.5" aria-hidden="true" />}>
        Overdue
      </StatusTag>
    );
  }
  if (urgency === "due-today") {
    return (
      <StatusTag tone="amber" icon={<CalendarClock className="size-3.5" aria-hidden="true" />}>
        Due today
      </StatusTag>
    );
  }
  return (
    <StatusTag tone="neutral" icon={<Clock className="size-3.5" aria-hidden="true" />}>
      Upcoming
    </StatusTag>
  );
}

export function AssignmentStatusTag({ status }: { status: "todo" | "submitted" | "returned" | "overdue" }) {
  if (status === "overdue") {
    return (
      <StatusTag tone="error" icon={<AlertTriangle className="size-3.5" aria-hidden="true" />}>
        Overdue
      </StatusTag>
    );
  }
  if (status === "submitted") {
    return (
      <StatusTag tone="info" icon={<FileCheck2 className="size-3.5" aria-hidden="true" />}>
        Submitted
      </StatusTag>
    );
  }
  if (status === "returned") {
    return (
      <StatusTag tone="sage" icon={<CheckCircle2 className="size-3.5" aria-hidden="true" />}>
        Returned
      </StatusTag>
    );
  }
  return (
    <StatusTag tone="neutral" icon={<CircleDot className="size-3.5" aria-hidden="true" />}>
      To do
    </StatusTag>
  );
}

export function SyncStatusTag({ status }: { status: "online" | "offline" | "syncing" | "pending" }) {
  if (status === "offline") {
    return (
      <StatusTag tone="neutral" icon={<WifiOff className="size-3.5" aria-hidden="true" />}>
        Offline
      </StatusTag>
    );
  }
  if (status === "syncing" || status === "pending") {
    return (
      <StatusTag tone="info" icon={<RefreshCw className="size-3.5 animate-spin" aria-hidden="true" />}>
        Syncing
      </StatusTag>
    );
  }
  return null;
}
