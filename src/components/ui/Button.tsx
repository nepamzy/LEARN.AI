import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cx } from "../../lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-sage text-white hover:bg-sage-hover active:bg-sage-hover disabled:bg-border disabled:text-ink-secondary",
  secondary: "bg-surface text-ink border border-border-strong hover:bg-sage-surface hover:border-sage disabled:bg-surface disabled:text-ink-secondary disabled:border-border",
  ghost: "bg-transparent text-ink hover:bg-sage-surface disabled:text-ink-secondary",
  destructive: "bg-error text-white hover:bg-[#9c3c3c] disabled:bg-border disabled:text-ink-secondary",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 gap-1.5 rounded-lg",
  md: "text-[15px] px-4 py-2.5 gap-2 rounded-xl",
  lg: "text-base px-5 py-3.5 gap-2 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, fullWidth, disabled, className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center font-semibold transition-colors duration-200 disabled:cursor-not-allowed cursor-pointer select-none",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});
