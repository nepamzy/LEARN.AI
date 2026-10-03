import { Link } from "react-router-dom";
import { ClipboardList, BarChart3, User, BookMarked, GraduationCap, Users, School, ChevronRight } from "lucide-react";
import { Card } from "../../components/ui/Card";

const ITEMS = [
  { to: "/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/revision", label: "Review today", icon: BookMarked },
  { to: "/exam", label: "Exam simulator", icon: GraduationCap },
  { to: "/profile", label: "Profile & settings", icon: User },
];

const EXPANSION_ITEMS = [
  { to: "/parent", label: "Parent portal (preview)", icon: Users },
  { to: "/teacher", label: "School dashboard (preview)", icon: School },
];

export function MorePage() {
  return (
    <div className="pb-6 space-y-5 pt-2">
      <h2 className="text-xl font-bold text-ink">More</h2>

      <Card padded={false}>
        <ul className="divide-y divide-border">
          {ITEMS.map((item) => (
            <li key={item.to}>
              <Link to={item.to} className="flex items-center gap-3 px-4 py-3.5">
                <item.icon className="size-5 text-sage" aria-hidden="true" />
                <span className="flex-1 font-medium text-[15px] text-ink">{item.label}</span>
                <ChevronRight className="size-4 text-ink-secondary" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <div>
        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-2 px-1">Coming soon</p>
        <Card padded={false}>
          <ul className="divide-y divide-border">
            {EXPANSION_ITEMS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="flex items-center gap-3 px-4 py-3.5">
                  <item.icon className="size-5 text-ink-secondary" aria-hidden="true" />
                  <span className="flex-1 font-medium text-[15px] text-ink">{item.label}</span>
                  <ChevronRight className="size-4 text-ink-secondary" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
