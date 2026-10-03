import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-10 px-6">
      {icon && (
        <div className="size-12 rounded-full bg-sage-surface text-sage flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        {description && <p className="text-[15px] text-ink-secondary max-w-sm mx-auto">{description}</p>}
      </div>
      {action}
    </div>
  );
}
