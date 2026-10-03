const ROUTE_TITLES: { test: (path: string) => boolean; title: string }[] = [
  { test: (p) => p === "/", title: "Home" },
  { test: (p) => p === "/learn", title: "Learn" },
  { test: (p) => p.startsWith("/practice/results"), title: "Results" },
  { test: (p) => p.startsWith("/practice/session"), title: "Practice" },
  { test: (p) => p === "/practice", title: "Practice" },
  { test: (p) => p.startsWith("/exam/setup"), title: "Set up mock exam" },
  { test: (p) => p.startsWith("/exam/intro"), title: "Before you start" },
  { test: (p) => p.startsWith("/exam/session"), title: "Mock exam" },
  { test: (p) => p.startsWith("/exam/results"), title: "Mock exam results" },
  { test: (p) => p === "/exam", title: "Exam simulator" },
  { test: (p) => p === "/tutor", title: "AI Tutor" },
  { test: (p) => p.startsWith("/assignments/") && p.endsWith("/report"), title: "Marked report" },
  { test: (p) => p.startsWith("/assignments/"), title: "Assignment" },
  { test: (p) => p === "/assignments", title: "Assignments" },
  { test: (p) => p.startsWith("/progress/topic/"), title: "Topic detail" },
  { test: (p) => p === "/progress", title: "Progress" },
  { test: (p) => p === "/revision", title: "Review today" },
  { test: (p) => p === "/profile", title: "Profile & settings" },
  { test: (p) => p === "/more", title: "More" },
  { test: (p) => p === "/parent", title: "Parent portal" },
  { test: (p) => p === "/teacher", title: "School dashboard" },
];

export function titleForPath(pathname: string): string {
  return ROUTE_TITLES.find((r) => r.test(pathname))?.title ?? "Astra Study";
}
