import type { ExamType } from "./types";

export interface ExamFormat {
  exam: ExamType;
  format: string;
  duration: string;
  subjects: string;
  bestFor: string;
}

export const examFormats: ExamFormat[] = [
  {
    exam: "JAMB",
    format: "Objective (CBT)",
    duration: "2 hours",
    subjects: "4 subjects · 180 questions",
    bestFor: "University entry via UTME",
  },
  {
    exam: "WAEC",
    format: "Objective + Theory",
    duration: "2–3 hours per subject",
    subjects: "Up to 9 subjects",
    bestFor: "Senior secondary certificate",
  },
  {
    exam: "NECO",
    format: "Objective + Theory",
    duration: "2–3 hours per subject",
    subjects: "Up to 9 subjects",
    bestFor: "Senior secondary certificate",
  },
  {
    exam: "Post-UTME",
    format: "Objective (CBT)",
    duration: "45–90 min",
    subjects: "Varies by institution",
    bestFor: "University screening after JAMB",
  },
  {
    exam: "BECE",
    format: "Objective + Theory",
    duration: "1.5–2 hours per subject",
    subjects: "Up to 10 subjects",
    bestFor: "Junior secondary exit",
  },
  {
    exam: "Common Entrance",
    format: "Objective",
    duration: "45–60 min per subject",
    subjects: "Maths, English, General knowledge",
    bestFor: "Secondary school entry",
  },
];
