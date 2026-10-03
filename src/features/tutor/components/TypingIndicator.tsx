import { Compass } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-2.5 items-start" role="status" aria-label="Astra is typing">
      <span className="size-8 rounded-full bg-sage-surface text-sage flex items-center justify-center shrink-0">
        <Compass className="size-4" aria-hidden="true" />
      </span>
      <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-ink-secondary animate-pulse-soft"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
