// Phase 7d §1a: replaces Phase 7b's generic 18-course/6-faculty placeholder
// with the real catalog of the Air Force Institute of Technology (AFIT),
// Kaduna — this app's first launch institution. Still a CONVENIENCE list for
// onboarding autocomplete, not a completeness claim: a typed course works
// identically to a listed one (see CourseEditor.tsx), and coverage for any
// course NOT on this list still comes from the tutor/assignment paths
// accepting free text (see supabase/functions/ai-proxy/levelFraming.ts).
//
// Sourced 2026-10-11 via web search (this sandbox could not reach
// afit.edu.ng directly — WebFetch failed with DNS resolution errors on
// afit.edu.ng, en.wikipedia.org, and abstechconnect.com alike, so this is
// built from search-result snippets, not a single authoritative fetch):
//   - Faculties (Air Engineering, Ground and Communication Engineering,
//     Computing, Social and Management Sciences, Sciences) and the
//     Banking and Finance / Marketing / International Relations programmes
//     specifically: Wikipedia's "Air Force Institute of Technology
//     (Nigeria)" article, corroborated by a 2022 NUC accreditation report
//     snippet quoting "Banking and Finance, International Relations and
//     Marketing from the Faculty of Management and Social Sciences".
//   - The rest of the undergraduate degree list (Aerospace/Automotive/
//     Mechanical/Mechatronics/Metallurgical & Materials/Civil/Electrical &
//     Electronics/ICT/Telecommunication Engineering, Chemistry/Mathematics/
//     Statistics/Physics/Physics with Electronics, Computer Science/Cyber
//     Security, Accounting/Business Administration/Economics/International
//     Relations): a May 2026 Post-UTME screening notice for the 2026/2027
//     session (abstechconnect.com / nigeriastartupact.ng).
//   - Postgraduate programmes (School of Postgraduate Studies): two
//     independent directory listings agreeing on five: Aeronautical and
//     Aerospace Engineering, Construction Engineering, Electrical and
//     Electronic Engineering, Logistics Management, Thermal Engineering.
//     A less consistently corroborated source also named a Telecommunications
//     Engineering postgraduate option — NOT included below for that reason.
//
// Known gap, stated honestly rather than guessed at: separate articles
// referenced AFIT "newly NUC-accredited programmes for 2026/2027" without
// naming them in the retrievable snippets, and the article itself could not
// be fetched from this sandbox (same DNS failure as above). Those new
// programme names are NOT in this catalog — recheck against AFIT's own
// admissions page once reachable, rather than treating this list as final.
//
// Course codes below follow the standard Nigerian university 100/200/300-
// level numbering convention and are illustrative, not verified against an
// actual AFIT syllabus/course-code book (no such document was reachable) —
// the FACULTY and PROGRAMME names are the part sourced above; the specific
// course titles/codes under each are realistic, standard first- and
// upper-level courses for that programme, the same honest standard Phase 7b
// held itself to for its original 6-faculty placeholder list.

export interface SeedCourse {
  id: string;
  name: string;
  code: string;
  faculty: string;
}

export const SEED_COURSES: SeedCourse[] = [
  // ---- Faculty of Air Engineering ----------------------------------------
  { id: "aee-intro", name: "Introduction to Aerospace Engineering", code: "AEE 101", faculty: "Air Engineering" },
  { id: "aee-structures", name: "Aircraft Structures", code: "AEE 301", faculty: "Air Engineering" },

  { id: "mee-mech", name: "Engineering Mechanics", code: "MEE 201", faculty: "Air Engineering" },
  { id: "mee-thermo", name: "Thermodynamics", code: "MEE 202", faculty: "Air Engineering" },
  { id: "mee-fluids", name: "Fluid Mechanics", code: "MEE 301", faculty: "Air Engineering" },

  { id: "aue-intro", name: "Introduction to Automotive Engineering", code: "AUE 101", faculty: "Air Engineering" },
  { id: "aue-dynamics", name: "Vehicle Dynamics", code: "AUE 301", faculty: "Air Engineering" },

  { id: "mce-intro", name: "Introduction to Mechatronics Engineering", code: "MCE 101", faculty: "Air Engineering" },
  { id: "mce-robotics", name: "Robotics and Automation", code: "MCE 301", faculty: "Air Engineering" },

  { id: "mme-materials", name: "Introduction to Materials Science", code: "MME 101", faculty: "Air Engineering" },
  { id: "mme-metallurgy", name: "Metallurgical Thermodynamics", code: "MME 301", faculty: "Air Engineering" },

  // ---- Faculty of Ground and Communication Engineering --------------------
  { id: "eee-circuits", name: "Circuit Theory", code: "EEE 201", faculty: "Ground and Communication Engineering" },
  { id: "eee-fields", name: "Electromagnetic Fields", code: "EEE 301", faculty: "Ground and Communication Engineering" },

  { id: "cve-intro", name: "Introduction to Civil Engineering", code: "CVE 101", faculty: "Ground and Communication Engineering" },
  { id: "cve-structures", name: "Structural Analysis", code: "CVE 301", faculty: "Ground and Communication Engineering" },

  { id: "tce-intro", name: "Introduction to Telecommunications Engineering", code: "TCE 101", faculty: "Ground and Communication Engineering" },
  { id: "tce-digital", name: "Digital Communication Systems", code: "TCE 301", faculty: "Ground and Communication Engineering" },

  // ---- Faculty of Computing -------------------------------------------------
  { id: "cs-algo", name: "Introduction to Algorithms and Data Structures", code: "CSC 201", faculty: "Computing" },
  { id: "cs-db", name: "Database Management Systems", code: "CSC 305", faculty: "Computing" },
  { id: "cs-os", name: "Operating Systems", code: "CSC 307", faculty: "Computing" },

  { id: "ict-intro", name: "Introduction to Information and Communication Technology", code: "ICT 101", faculty: "Computing" },
  { id: "ict-networks", name: "Computer Networks", code: "ICT 201", faculty: "Computing" },

  { id: "cyb-intro", name: "Introduction to Cyber Security", code: "CYB 101", faculty: "Computing" },
  { id: "cyb-network", name: "Network Security", code: "CYB 301", faculty: "Computing" },

  // ---- Faculty of Social and Management Sciences --------------------------
  { id: "acc-fin1", name: "Financial Accounting I", code: "ACC 101", faculty: "Social and Management Sciences" },
  { id: "acc-cost", name: "Cost Accounting", code: "ACC 204", faculty: "Social and Management Sciences" },
  { id: "acc-audit", name: "Auditing", code: "ACC 306", faculty: "Social and Management Sciences" },

  { id: "bus-mgmt", name: "Principles of Management", code: "BUS 101", faculty: "Social and Management Sciences" },
  { id: "bus-behaviour", name: "Organisational Behaviour", code: "BUS 201", faculty: "Social and Management Sciences" },

  { id: "eco-micro", name: "Principles of Microeconomics", code: "ECO 101", faculty: "Social and Management Sciences" },
  { id: "eco-macro", name: "Principles of Macroeconomics", code: "ECO 102", faculty: "Social and Management Sciences" },
  { id: "eco-metrics", name: "Econometrics", code: "ECO 301", faculty: "Social and Management Sciences" },

  { id: "mkt-principles", name: "Principles of Marketing", code: "MKT 101", faculty: "Social and Management Sciences" },
  { id: "mkt-consumer", name: "Consumer Behaviour", code: "MKT 201", faculty: "Social and Management Sciences" },

  { id: "bfn-intro", name: "Introduction to Banking and Finance", code: "BFN 101", faculty: "Social and Management Sciences" },
  { id: "bfn-monetary", name: "Monetary Economics", code: "BFN 301", faculty: "Social and Management Sciences" },

  { id: "irs-intro", name: "Introduction to International Relations", code: "IRS 101", faculty: "Social and Management Sciences" },
  { id: "irs-foreign", name: "Foreign Policy Analysis", code: "IRS 301", faculty: "Social and Management Sciences" },

  // ---- Faculty of Sciences ---------------------------------------------------
  { id: "chm-general1", name: "General Chemistry I", code: "CHM 101", faculty: "Sciences" },
  { id: "chm-organic", name: "Organic Chemistry", code: "CHM 201", faculty: "Sciences" },

  { id: "mth-calculus1", name: "Calculus I", code: "MTH 101", faculty: "Sciences" },
  { id: "mth-linear", name: "Linear Algebra", code: "MTH 201", faculty: "Sciences" },

  { id: "phy-general1", name: "General Physics I", code: "PHY 101", faculty: "Sciences" },
  { id: "phy-mechanics", name: "Classical Mechanics", code: "PHY 201", faculty: "Sciences" },

  { id: "phe-intro", name: "Introduction to Electronics", code: "PHE 101", faculty: "Sciences" },
  { id: "phe-circuits", name: "Circuit Theory for Physicists", code: "PHE 201", faculty: "Sciences" },

  { id: "sta-intro", name: "Introduction to Statistics", code: "STA 101", faculty: "Sciences" },
  { id: "sta-probability", name: "Probability Theory", code: "STA 201", faculty: "Sciences" },

  // ---- School of Postgraduate Studies (named programmes, not courses) -----
  { id: "pg-aerospace", name: "Aeronautical and Aerospace Engineering (Postgraduate)", code: "PG-AAE", faculty: "School of Postgraduate Studies" },
  { id: "pg-construction", name: "Construction Engineering (Postgraduate)", code: "PG-CSE", faculty: "School of Postgraduate Studies" },
  { id: "pg-electrical", name: "Electrical and Electronic Engineering (Postgraduate)", code: "PG-EEE", faculty: "School of Postgraduate Studies" },
  { id: "pg-logistics", name: "Logistics Management (Postgraduate)", code: "PG-LOG", faculty: "School of Postgraduate Studies" },
  { id: "pg-thermal", name: "Thermal Engineering (Postgraduate)", code: "PG-THE", faculty: "School of Postgraduate Studies" },
];

export const SEED_FACULTIES = Array.from(new Set(SEED_COURSES.map((c) => c.faculty)));
