// Core domain types for Astra Study.
// Designed so mock data and a future API client share the same shape.

export type ExamType = "JAMB" | "WAEC" | "NECO" | "Post-UTME" | "BECE" | "Common Entrance";

export type StudyGoalPace = "light" | "steady" | "ambitious" | "custom";

export type MasteryStatus = "strong" | "building" | "review" | "support";

export type MistakeType = "concept" | "careless" | "time-pressure";

export type Language = "en" | "pcm";

export type FontSize = "default" | "large" | "larger";

export interface Subject {
  id: string;
  name: string;
  color: "sage" | "amber" | "info";
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  parentTopicId?: string; // for subtopics
}

export interface MasteryRecord {
  topicId: string;
  status: MasteryStatus;
  masteryProbability: number; // 0-1, internal — never shown raw to students
  trend: "up" | "down" | "flat";
  questionsAttempted: number;
  lastPracticed?: string; // ISO date
  nextReviewDue?: string; // ISO date
  confidence: "low" | "medium" | "high";
}

export interface SubjectMastery {
  subjectId: string;
  status: MasteryStatus;
  changeNote?: string;
  nextRecommendation: string;
}

export interface Student {
  id: string;
  name: string;
  avatarInitials: string;
  exam: ExamType;
  examDate: string; // ISO date
  subjects: string[]; // subject ids
  weeklyGoalPace: StudyGoalPace;
  weeklyGoalMinutesTarget: number;
  weeklyGoalMinutesDone: number;
  streakDays: number;
  language: Language;
  fontSize: FontSize;
  reducedMotion: boolean;
  lowDataMode: boolean;
  plan: "free" | "premium" | "school";
}

export type TaskKind = "revision" | "practice" | "assignment" | "tutor-checkin";
export type TaskUrgency = "due-today" | "upcoming" | "overdue";

export interface PlanTask {
  id: string;
  kind: TaskKind;
  subjectId: string;
  topicId?: string;
  title: string;
  estimatedMinutes: number;
  urgency: TaskUrgency;
  reason: string;
  completed: boolean;
  date: string; // ISO date this task belongs to
}

export interface Question {
  id: string;
  subjectId: string;
  topicId: string;
  type: "mcq" | "fill-blank" | "short-answer" | "theory" | "essay";
  prompt: string;
  options?: { id: string; label: string }[];
  correctOptionId?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  explanation: string;
  whyWrongByOption?: Record<string, string>;
  workedExample?: string;
}

export interface PracticeAttempt {
  questionId: string;
  selectedOptionId?: string;
  isCorrect: boolean;
  mistakeType?: MistakeType;
  timeSeconds: number;
  flagged?: boolean;
}

export interface Insight {
  id: string;
  subjectId?: string;
  topicId?: string;
  message: string;
  kind: "positive" | "neutral" | "attention";
  date: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  icon: "flame" | "target" | "trophy" | "star" | "check";
}

export type AssignmentStatus = "todo" | "submitted" | "returned" | "overdue";
export type AssignmentSource = "ai" | "teacher";
export type AssignmentFormat = "objective" | "theory" | "essay" | "mixed";

export interface RubricCriterion {
  id: string;
  name: string;
  maxScore: number;
  score?: number;
  feedback?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subjectId: string;
  topicId?: string;
  dueDate: string;
  estimatedMinutes: number;
  format: AssignmentFormat;
  source: AssignmentSource;
  status: AssignmentStatus;
  objective: string;
  instructions: string;
  rubric: RubricCriterion[];
  resources?: string[];
  totalScore?: number;
  maxScore: number;
  submittedAt?: string;
  returnedAt?: string;
  teacherOverride?: {
    adjustedScore: number;
    comment: string;
    status: "approved" | "adjusted";
  };
  markedBy?: "ai" | "teacher";
  strengths?: string[];
  improvements?: string[];
  nextSteps?: string[];
  modelAnswerExcerpt?: string;
}

export interface ChatMessage {
  id: string;
  role: "student" | "tutor";
  content: string;
  type?: "text" | "quoted-question" | "worked-steps";
  timestamp: string;
}

export interface RevisionItem {
  id: string;
  subjectId: string;
  topicId: string;
  topicName: string;
  reason: string;
  estimatedMinutes: number;
  mode: "flashcard" | "mini-quiz" | "worked-problem" | "recap";
  urgencyRank: number;
}

export interface ParentChild {
  id: string;
  name: string;
  exam: ExamType;
  examDate: string;
}

export interface SyncState {
  status: "online" | "offline" | "syncing" | "pending";
  pendingChanges: number;
}
