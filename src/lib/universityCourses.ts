// Phase 7b: a CONVENIENCE list for onboarding autocomplete only — not a
// completeness claim. It spans a handful of faculties with real Nigerian
// university course names/codes (the numbering convention — 100/200/300
// level — matches what most Nigerian universities use), so a student
// skimming suggestions sees something recognisable. Coverage for any course
// NOT on this list comes from the tutor/assignment paths accepting free text
// and reasoning about it with the LLM's own general knowledge (see
// supabase/functions/ai-proxy/levelFraming.ts) — never from growing this
// list. Do not treat its size as a target to hit; it stays modest on purpose.

export interface SeedCourse {
  id: string;
  name: string;
  code: string;
  faculty: string;
}

export const SEED_COURSES: SeedCourse[] = [
  { id: "cs-algo", name: "Introduction to Algorithms and Data Structures", code: "CSC 201", faculty: "Computer Science" },
  { id: "cs-db", name: "Database Management Systems", code: "CSC 305", faculty: "Computer Science" },
  { id: "cs-os", name: "Operating Systems", code: "CSC 307", faculty: "Computer Science" },

  { id: "acc-fin1", name: "Financial Accounting I", code: "ACC 101", faculty: "Accounting" },
  { id: "acc-cost", name: "Cost Accounting", code: "ACC 204", faculty: "Accounting" },
  { id: "acc-audit", name: "Auditing", code: "ACC 306", faculty: "Accounting" },

  { id: "law-system", name: "Nigerian Legal System", code: "LAW 101", faculty: "Law" },
  { id: "law-contract", name: "Law of Contract", code: "LAW 201", faculty: "Law" },
  { id: "law-torts", name: "Law of Torts", code: "LAW 202", faculty: "Law" },

  { id: "nsc-anatomy", name: "Anatomy and Physiology", code: "NSC 101", faculty: "Nursing Science" },
  { id: "nsc-fund", name: "Fundamentals of Nursing", code: "NSC 102", faculty: "Nursing Science" },
  { id: "nsc-community", name: "Community Health Nursing", code: "NSC 303", faculty: "Nursing Science" },

  { id: "eco-micro", name: "Principles of Microeconomics", code: "ECO 101", faculty: "Economics" },
  { id: "eco-macro", name: "Principles of Macroeconomics", code: "ECO 102", faculty: "Economics" },
  { id: "eco-metrics", name: "Econometrics", code: "ECO 301", faculty: "Economics" },

  { id: "mee-mech", name: "Engineering Mechanics", code: "MEE 201", faculty: "Mechanical Engineering" },
  { id: "mee-thermo", name: "Thermodynamics", code: "MEE 202", faculty: "Mechanical Engineering" },
  { id: "mee-fluids", name: "Fluid Mechanics", code: "MEE 301", faculty: "Mechanical Engineering" },
];

export const SEED_FACULTIES = Array.from(new Set(SEED_COURSES.map((c) => c.faculty)));
