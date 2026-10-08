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
  // "primary" | "junior-secondary" | "senior-secondary" | "university".
  // Kept as a plain string here so this file doesn't need to import lib/types.ts.
  level?: string;
  // Phase 7b: the active course's name, sent only for a university-level
  // request — this is the entire mechanism that makes "any course" work,
  // seeded or typed: the server has no course catalog, just this string.
  courseName?: string;
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
  // Phase 7b: set for a university submission so grading has the same course
  // context the assignment was generated with (and the tutor gets).
  courseName?: string;
}

// Phase 7b: the shape generate-assignment returns, before rubric ids are
// assigned a stable client-side identity (see assignmentGeneration.ts).
export interface GeneratedAssignment {
  title: string;
  objective: string;
  instructions: string;
  rubric: RubricCriterion[];
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
