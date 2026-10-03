import type { Subject } from "../../lib/types";
import { cx } from "../../lib/utils";

const dotClasses: Record<Subject["color"], string> = {
  sage: "bg-sage",
  amber: "bg-amber",
  info: "bg-info",
};

export function SubjectDot({ color, className }: { color: Subject["color"]; className?: string }) {
  return <span className={cx("inline-block size-2.5 rounded-full shrink-0", dotClasses[color], className)} aria-hidden="true" />;
}
