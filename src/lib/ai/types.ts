export type TutorTone = "concise" | "guided" | "visual" | "step-by-step";

export interface TutorTurn {
  role: "student" | "tutor";
  content: string;
}

export interface TutorRequest {
  message: string;
  tone: TutorTone;
  history: TutorTurn[];
  subjectId?: string;
  topicName?: string;
  // "primary" | "junior-secondary" | "senior-secondary" (never "university" —
  // TutorPage shows the coming-soon state instead of calling the proxy at
  // all for that level). Matches EducationLevel minus "university"; kept as
  // a plain string here so this file doesn't need to import lib/types.ts.
  level?: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  maxScore: number;
}

export type SubmissionMethod = "type" | "photo";

export interface GradingRequest {
  assignmentTitle: string;
  objective: string;
  rubric: RubricCriterion[];
  studentText: string;
}

export interface CriterionGrade {
  criterionId: string;
  score: number;
  feedback: string;
  quotes: string[];
}

export interface GradingResult {
  criteria: CriterionGrade[];
  totalScore: number;
  maxScore: number;
  strengths: string[];
  improvements: string[];
}

export class AiUnavailableError extends Error {
  constructor(message = "AI feedback is not configured for this build.") {
    super(message);
    this.name = "AiUnavailableError";
  }
}

export class AiRateLimitError extends Error {
  constructor() {
    super("Daily AI limit reached.");
    this.name = "AiRateLimitError";
  }
}
