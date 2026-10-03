import { clamp } from "../../lib/utils";

interface LinearProgressProps {
  value: number; // 0-100
  label: string;
  tone?: "sage" | "amber" | "info";
  showPercentLabel?: boolean;
}

const toneBg: Record<string, string> = {
  sage: "bg-sage",
  amber: "bg-amber",
  info: "bg-info",
};

export function LinearProgress({ value, label, tone = "sage", showPercentLabel = true }: LinearProgressProps) {
  const pct = clamp(value, 0, 100);
  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 w-full rounded-pill bg-[#EDEBE3] overflow-hidden"
      >
        <div
          className={`h-full rounded-pill ${toneBg[tone]} transition-[width] duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showPercentLabel && (
        <p className="mt-1 text-sm text-ink-secondary">
          {label}
        </p>
      )}
    </div>
  );
}

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  tone?: "sage" | "amber" | "info";
  label: string;
  children?: React.ReactNode;
}

const toneStroke: Record<string, string> = {
  sage: "#2F6B5B",
  amber: "#B66A22",
  info: "#416D8F",
};

export function CircularProgress({ value, size = 72, strokeWidth = 7, tone = "sage", label, children }: CircularProgressProps) {
  const pct = clamp(value, 0, 100);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EDEBE3" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={toneStroke[tone]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

export function SkillBar({ value, tone = "sage" }: { value: number; tone?: "sage" | "amber" | "info" }) {
  const pct = clamp(value, 0, 100);
  const segments = 5;
  const filled = Math.round((pct / 100) * segments);
  return (
    <div className="flex gap-1" role="img" aria-label={`${pct}% mastery`}>
      {Array.from({ length: segments }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i < filled ? toneBg[tone] : "bg-[#EDEBE3]"}`}
        />
      ))}
    </div>
  );
}
