export interface ClassSummary {
  id: string;
  name: string;
  studentCount: number;
  avgMastery: number;
  assignmentsToReview: number;
}

export interface StudentRow {
  id: string;
  name: string;
  mastery: Record<string, number>; // topic label -> 0-100
  needsSupport: boolean;
}

export const classes: ClassSummary[] = [
  { id: "c1", name: "SS3 Science A", studentCount: 34, avgMastery: 68, assignmentsToReview: 6 },
  { id: "c2", name: "SS3 Science B", studentCount: 29, avgMastery: 61, assignmentsToReview: 3 },
  { id: "c3", name: "SS2 Science A", studentCount: 31, avgMastery: 72, assignmentsToReview: 0 },
];

export const heatmapTopics = ["Simultaneous Eqns", "Quadratics", "Stoichiometry", "Genetics", "Essay structure"];

export const students: StudentRow[] = [
  { id: "s1", name: "Amara O.", mastery: { "Simultaneous Eqns": 58, Quadratics: 64, Stoichiometry: 28, Genetics: 52, "Essay structure": 82 }, needsSupport: true },
  { id: "s2", name: "Tunde A.", mastery: { "Simultaneous Eqns": 81, Quadratics: 75, Stoichiometry: 70, Genetics: 66, "Essay structure": 60 }, needsSupport: false },
  { id: "s3", name: "Chidinma E.", mastery: { "Simultaneous Eqns": 45, Quadratics: 40, Stoichiometry: 35, Genetics: 58, "Essay structure": 55 }, needsSupport: true },
  { id: "s4", name: "Ifeoma K.", mastery: { "Simultaneous Eqns": 90, Quadratics: 88, Stoichiometry: 77, Genetics: 80, "Essay structure": 85 }, needsSupport: false },
  { id: "s5", name: "Emeka N.", mastery: { "Simultaneous Eqns": 62, Quadratics: 58, Stoichiometry: 40, Genetics: 44, "Essay structure": 50 }, needsSupport: true },
];

export const reteachTopics = [
  { topic: "Stoichiometry", classAvg: 42, note: "Over half the class scored below 50% on mole-ratio questions." },
  { topic: "Genetics — Punnett squares", classAvg: 56, note: "Common error: confusing dominant/recessive allele ratios." },
];
