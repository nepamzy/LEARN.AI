import {
  Home,
  BookOpen,
  PencilLine,
  ClipboardList,
  Sparkles,
  BarChart3,
  User,
  MoreHorizontal,
} from "lucide-react";
import type { ComponentType } from "react";

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

export const primaryNav: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/practice", label: "Practice", icon: PencilLine },
  { to: "/tutor", label: "AI Tutor", icon: Sparkles },
  { to: "/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
];

// Mobile bottom nav: Home, Learn, Practice, Tutor, More
export const mobileNav: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/practice", label: "Practice", icon: PencilLine },
  { to: "/tutor", label: "Tutor", icon: Sparkles },
  { to: "/more", label: "More", icon: MoreHorizontal },
];
