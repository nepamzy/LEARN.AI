import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../../lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
  interactive?: boolean;
}

export function Card({ children, padded = true, interactive, className, ...props }: CardProps) {
  return (
    <div
      className={cx(
        "bg-surface border border-border rounded-card shadow-soft",
        padded && "p-4 sm:p-5",
        interactive && "transition-shadow duration-200 hover:shadow-raised cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
