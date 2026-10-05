import type { EducationLevel, ExamType, StudyGoalPace, Language, FontSize } from "../../lib/types";

export interface OnboardingData {
  educationLevel: EducationLevel | null;
  exam: ExamType | null;
  subjects: string[];
  examDate: string;
  examDateUnknown: boolean;
  goalPace: StudyGoalPace;
  customMinutes: number;
  diagnosticChoice: "pending" | "taking" | "done" | "skipped";
  diagnosticCorrect: number;
  diagnosticTotal: number;
  language: Language;
  fontSize: FontSize;
  notificationsChoice: "granted" | "denied" | "later" | null;
  isUnderage: boolean;
  guardianEmail: string;
}

export const defaultOnboardingData: OnboardingData = {
  educationLevel: null,
  exam: null,
  subjects: [],
  examDate: "",
  examDateUnknown: false,
  goalPace: "steady",
  customMinutes: 240,
  diagnosticChoice: "pending",
  diagnosticCorrect: 0,
  diagnosticTotal: 0,
  language: "en",
  fontSize: "default",
  notificationsChoice: null,
  isUnderage: false,
  guardianEmail: "",
};

export const EXAM_SUBJECTS: Record<string, string[]> = {
  JAMB: ["math", "english", "biology", "chemistry"],
  WAEC: ["math", "english", "biology", "chemistry"],
  NECO: ["math", "english", "biology", "chemistry"],
  "Post-UTME": ["math", "english", "biology", "chemistry"],
  BECE: ["math", "english", "biology"],
  "Common Entrance": ["math", "english"],
};
