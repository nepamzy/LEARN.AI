import type { EducationLevel, ExamType, StudyGoalPace, Language, FontSize, UniversityCourse } from "../../lib/types";
// Phase 7c: moved to lib/educationLevel.ts so Practice/Progress/Revision/
// Learn's level gating (§1c) can reuse the exact same mapping — re-exported
// here so this file's existing imports (OnboardingFlow, SubjectsStep) don't
// need to change.
export { EXAM_SUBJECTS } from "../../lib/educationLevel";

export interface OnboardingData {
  educationLevel: EducationLevel | null;
  exam: ExamType | null;
  subjects: string[];
  universityInstitution: string;
  universityFaculty: string;
  universityProgram: string;
  universityCourses: UniversityCourse[];
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
  universityInstitution: "",
  universityFaculty: "",
  universityProgram: "",
  universityCourses: [],
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
