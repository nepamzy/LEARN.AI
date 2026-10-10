import type {
  Student,
  Subject,
  Topic,
  MasteryRecord,
  SubjectMastery,
  PlanTask,
  Question,
  Insight,
  Achievement,
  Assignment,
  ChatMessage,
  RevisionItem,
  ParentChild,
} from "./types";

// ---- Student profile -------------------------------------------------

export const amara: Student = {
  id: "stu_amara",
  name: "Amara",
  avatarInitials: "AO",
  educationLevel: "senior-secondary",
  exam: "JAMB",
  examDate: "2026-05-16",
  subjects: ["math", "english", "biology", "chemistry"],
  weeklyGoalPace: "steady",
  weeklyGoalMinutesTarget: 300,
  weeklyGoalMinutesDone: 185,
  streakDays: 6,
  language: "en",
  fontSize: "default",
  reducedMotion: false,
  lowDataMode: false,
  plan: "free",
};

export const todayStudyMinutes = 18;

// ---- Subjects & topics -------------------------------------------------

export const subjects: Subject[] = [
  { id: "math", name: "Mathematics", color: "sage" },
  { id: "english", name: "English Language", color: "info" },
  { id: "biology", name: "Biology", color: "sage" },
  { id: "chemistry", name: "Chemistry", color: "amber" },
  // Phase 7c §1d / Phase 7d §1c: the two seeded university courses with real
  // structured practice content (see src/lib/universityCourses.ts's
  // "cs-algo" and "mth-calculus1" entries). Every other seeded or custom
  // university course deliberately has none — see the Phase 7c/7d reports
  // for why these two, and why not more.
  { id: "uni-cs-algo", name: "Introduction to Algorithms and Data Structures", color: "info" },
  { id: "uni-mth-calc1", name: "Calculus I", color: "sage" },
];

// Math/English topic *metadata* (name, subject, grouping) still lives here so
// getTopic()/getSubject() keep resolving synchronously everywhere in the UI —
// but as of Phase 2, their *mastery* numbers come from the live BKT/FSRS
// engine (src/lib/engine, src/lib/api/liveData.ts) against Supabase, not the
// masteryRecords array below. See LIVE_SUBJECT_IDS in src/lib/supabase.ts.
export const topics: Topic[] = [
  { id: "math-algebra", subjectId: "math", name: "Algebra" },
  { id: "math-algebra-simeq", subjectId: "math", name: "Simultaneous Equations", parentTopicId: "math-algebra" },
  { id: "math-algebra-quad", subjectId: "math", name: "Quadratic Equations", parentTopicId: "math-algebra" },
  { id: "math-geometry", subjectId: "math", name: "Geometry" },
  { id: "math-geometry-circles", subjectId: "math", name: "Circle Theorems", parentTopicId: "math-geometry" },
  { id: "math-trig", subjectId: "math", name: "Trigonometry" },
  { id: "math-stats", subjectId: "math", name: "Statistics" },
  { id: "math-indices", subjectId: "math", name: "Indices and Logarithms" },
  { id: "math-sets", subjectId: "math", name: "Sets and Venn Diagrams" },

  { id: "eng-comprehension", subjectId: "english", name: "Comprehension" },
  { id: "eng-lexis", subjectId: "english", name: "Lexis & Structure" },
  { id: "eng-essay", subjectId: "english", name: "Essay Writing" },
  { id: "eng-oral", subjectId: "english", name: "Oral English" },
  { id: "eng-grammar", subjectId: "english", name: "Grammar" },
  { id: "eng-vocabulary", subjectId: "english", name: "Vocabulary" },
  { id: "eng-cloze", subjectId: "english", name: "Cloze Test" },

  { id: "bio-ecology", subjectId: "biology", name: "Ecology" },
  { id: "bio-genetics", subjectId: "biology", name: "Genetics" },
  { id: "bio-cell", subjectId: "biology", name: "Cell Biology" },
  { id: "bio-reproduction", subjectId: "biology", name: "Reproduction" },

  { id: "chem-stoich", subjectId: "chemistry", name: "Stoichiometry" },
  { id: "chem-bonding", subjectId: "chemistry", name: "Chemical Bonding" },
  { id: "chem-organic", subjectId: "chemistry", name: "Organic Chemistry" },
  { id: "chem-electro", subjectId: "chemistry", name: "Electrochemistry" },

  // Phase 7c §1d pilot: topic metadata for the one seeded university course.
  // Mastery for these, like Math/English, comes live from Supabase — see
  // LIVE_SUBJECT_IDS below and the Phase 7c migration that seeds its questions.
  { id: "uni-cs-algo-bigo", subjectId: "uni-cs-algo", name: "Big-O and Algorithm Complexity" },
  { id: "uni-cs-algo-arrays", subjectId: "uni-cs-algo", name: "Arrays and Linked Lists" },
  { id: "uni-cs-algo-sorting", subjectId: "uni-cs-algo", name: "Sorting Algorithms" },
  { id: "uni-cs-algo-stacks-queues", subjectId: "uni-cs-algo", name: "Stacks and Queues" },
  { id: "uni-cs-algo-recursion", subjectId: "uni-cs-algo", name: "Recursion" },

  // Phase 7d §1c pilot: topic metadata for the second seeded university
  // course (Faculty of Sciences). Mastery comes live from Supabase, same as
  // uni-cs-algo — see LIVE_SUBJECT_IDS below and the Phase 7d migration.
  { id: "uni-mth-calc1-limits", subjectId: "uni-mth-calc1", name: "Limits and Continuity" },
  { id: "uni-mth-calc1-derivatives", subjectId: "uni-mth-calc1", name: "Derivatives and Differentiation Rules" },
  { id: "uni-mth-calc1-applications", subjectId: "uni-mth-calc1", name: "Applications of Derivatives" },
  { id: "uni-mth-calc1-integration", subjectId: "uni-mth-calc1", name: "Introduction to Integration" },
  { id: "uni-mth-calc1-sequences", subjectId: "uni-mth-calc1", name: "Sequences and Series" },
];

// ---- Mastery ------------------------------------------------------------

export const subjectMastery: SubjectMastery[] = [
  { subjectId: "math", status: "building", changeNote: "Up since last week", nextRecommendation: "Review Simultaneous Equations" },
  { subjectId: "english", status: "strong", changeNote: "Steady for 3 weeks", nextRecommendation: "Keep sharpening essay structure" },
  { subjectId: "biology", status: "building", changeNote: "Improved after last quiz", nextRecommendation: "Revisit Genetics vocabulary" },
  { subjectId: "chemistry", status: "support", changeNote: "Needs attention", nextRecommendation: "Start with Stoichiometry basics" },
];

// Biology/Chemistry (and English Essay Writing, which stays on the mocked
// assignment-grading path) are untouched by Phase 2. Mathematics and English's
// other topics now come from the live engine — see the note above.
export const masteryRecords: MasteryRecord[] = [
  { topicId: "eng-essay", status: "building", masteryProbability: 0.67, trend: "up", questionsAttempted: 9, lastPracticed: "2026-09-29", nextReviewDue: "2026-10-05", confidence: "medium" },

  { topicId: "bio-ecology", status: "building", masteryProbability: 0.61, trend: "up", questionsAttempted: 20, lastPracticed: "2026-09-30", nextReviewDue: "2026-10-02", confidence: "medium" },
  { topicId: "bio-genetics", status: "review", masteryProbability: 0.52, trend: "down", questionsAttempted: 17, lastPracticed: "2026-09-22", nextReviewDue: "2026-10-02", confidence: "low" },
  { topicId: "bio-cell", status: "strong", masteryProbability: 0.85, trend: "flat", questionsAttempted: 26, lastPracticed: "2026-09-24", nextReviewDue: "2026-10-12", confidence: "high" },
  { topicId: "bio-reproduction", status: "building", masteryProbability: 0.66, trend: "up", questionsAttempted: 11, lastPracticed: "2026-09-21", nextReviewDue: "2026-10-07", confidence: "medium" },

  { topicId: "chem-stoich", status: "support", masteryProbability: 0.28, trend: "flat", questionsAttempted: 8, lastPracticed: "2026-09-19", nextReviewDue: "2026-10-02", confidence: "low" },
  { topicId: "chem-bonding", status: "support", masteryProbability: 0.35, trend: "down", questionsAttempted: 13, lastPracticed: "2026-09-23", nextReviewDue: "2026-10-03", confidence: "low" },
  { topicId: "chem-organic", status: "building", masteryProbability: 0.58, trend: "up", questionsAttempted: 10, lastPracticed: "2026-09-27", nextReviewDue: "2026-10-06", confidence: "medium" },
  { topicId: "chem-electro", status: "review", masteryProbability: 0.49, trend: "flat", questionsAttempted: 6, lastPracticed: "2026-09-15", nextReviewDue: "2026-10-04", confidence: "low" },
];

// ---- Today's plan --------------------------------------------------------

export const todayPlan: PlanTask[] = [
  {
    id: "task-1",
    kind: "revision",
    subjectId: "math",
    topicId: "math-algebra-simeq",
    title: "Review 12 Simultaneous Equations questions",
    estimatedMinutes: 12,
    urgency: "due-today",
    reason: "This topic is due for revision today",
    completed: false,
    date: "2026-10-02",
  },
  {
    id: "task-2",
    kind: "practice",
    subjectId: "chemistry",
    topicId: "chem-stoich",
    title: "Practice set: Stoichiometry basics",
    estimatedMinutes: 10,
    urgency: "due-today",
    reason: "Your weakest topic right now",
    completed: false,
    date: "2026-10-02",
  },
  {
    id: "task-3",
    kind: "assignment",
    subjectId: "english",
    title: "Submit: Essay — \"The importance of qualitative education\"",
    estimatedMinutes: 25,
    urgency: "upcoming",
    reason: "Due in 2 days",
    completed: false,
    date: "2026-10-02",
  },
  {
    id: "task-4",
    kind: "tutor-checkin",
    subjectId: "biology",
    topicId: "bio-genetics",
    title: "5-minute check-in with Astra on Genetics",
    estimatedMinutes: 5,
    urgency: "upcoming",
    reason: "Mastery dipped slightly last week",
    completed: false,
    date: "2026-10-02",
  },
];

// ---- Sample questions ------------------------------------------------

export const sampleQuestions: Question[] = [
  {
    id: "q1",
    subjectId: "math",
    topicId: "math-algebra-simeq",
    type: "mcq",
    prompt: "Solve for x and y: 2x + y = 11, x − y = 1",
    options: [
      { id: "a", label: "x = 4, y = 3" },
      { id: "b", label: "x = 3, y = 5" },
      { id: "c", label: "x = 5, y = 1" },
      { id: "d", label: "x = 4, y = 4" },
    ],
    correctOptionId: "a",
    difficulty: 2,
    explanation: "Adding the two equations eliminates y: (2x + y) + (x − y) = 11 + 1 → 3x = 12 → x = 4. Substitute back: 4 − y = 1 → y = 3.",
    whyWrongByOption: {
      b: "This satisfies the second equation but not the first — check your substitution step.",
      c: "This swaps the values of x and y.",
      d: "Close, but y does not satisfy x − y = 1.",
    },
    workedExample: "Try: 3x + y = 10, x − y = 2. Add both: 4x = 12 → x = 3, then y = 1.",
  },
  {
    id: "q2",
    subjectId: "math",
    topicId: "math-algebra-simeq",
    type: "mcq",
    prompt: "If 3x − 2y = 4 and x + y = 3, what is the value of x?",
    options: [
      { id: "a", label: "x = 1" },
      { id: "b", label: "x = 2" },
      { id: "c", label: "x = 3" },
      { id: "d", label: "x = 0" },
    ],
    correctOptionId: "b",
    difficulty: 2,
    explanation: "From x + y = 3, y = 3 − x. Substitute: 3x − 2(3 − x) = 4 → 3x − 6 + 2x = 4 → 5x = 10 → x = 2.",
    whyWrongByOption: {
      a: "Check your substitution of y = 3 − x into the first equation.",
      c: "This would make y negative — recheck the arithmetic after substitution.",
      d: "x = 0 does not satisfy the first equation.",
    },
  },
  {
    id: "q3",
    subjectId: "chemistry",
    topicId: "chem-stoich",
    type: "mcq",
    prompt: "How many moles of oxygen are needed to completely combust 2 moles of propane (C₃H₈)?",
    options: [
      { id: "a", label: "5 moles" },
      { id: "b", label: "8 moles" },
      { id: "c", label: "10 moles" },
      { id: "d", label: "3 moles" },
    ],
    correctOptionId: "c",
    difficulty: 3,
    explanation: "C₃H₈ + 5O₂ → 3CO₂ + 4H₂O. One mole of propane needs 5 moles of O₂, so 2 moles need 10 moles.",
    whyWrongByOption: {
      a: "This is the amount needed for 1 mole of propane, not 2.",
      b: "Check the balanced equation again — the O₂ coefficient is 5, not 4.",
      d: "This looks like the carbon count, not the oxygen requirement.",
    },
  },
  {
    id: "q4",
    subjectId: "biology",
    topicId: "bio-genetics",
    type: "mcq",
    prompt: "In a monohybrid cross between two heterozygous (Tt) tall pea plants, what fraction of offspring is expected to be short?",
    options: [
      { id: "a", label: "1/4" },
      { id: "b", label: "1/2" },
      { id: "c", label: "3/4" },
      { id: "d", label: "0" },
    ],
    correctOptionId: "a",
    difficulty: 2,
    explanation: "Tt × Tt gives offspring ratio 1 TT : 2 Tt : 1 tt. Only tt (1/4) is short, since tall is dominant.",
    whyWrongByOption: {
      b: "1/2 would be the fraction of heterozygotes (Tt), not short plants.",
      c: "3/4 is the fraction that is tall, not short.",
      d: "Short offspring are still possible from two heterozygous parents.",
    },
  },
  {
    id: "q5",
    subjectId: "english",
    topicId: "eng-lexis",
    type: "mcq",
    prompt: "Choose the option that best completes the sentence: \"The committee ___ its decision yesterday.\"",
    options: [
      { id: "a", label: "have announced" },
      { id: "b", label: "announced" },
      { id: "c", label: "announcing" },
      { id: "d", label: "are announcing" },
    ],
    correctOptionId: "b",
    difficulty: 1,
    explanation: "\"Committee\" is a collective noun treated as singular here, and \"yesterday\" signals simple past tense: \"announced.\"",
    whyWrongByOption: {
      a: "This uses a plural verb form with a singular collective noun, and the wrong tense.",
      c: "This is not a complete verb form for the sentence.",
      d: "Present continuous doesn't match \"yesterday.\"",
    },
  },
  // Phase 7c §1d: a couple of offline-fallback entries for the pilot
  // university course, same sparse per-subject pattern as everything above —
  // real coverage for it lives in Supabase (seeded by the Phase 7c
  // migration), fetched live exactly like Math/English. Without these, a
  // network failure here would fall through to this array's unfiltered
  // default and leak secondary-level questions into a university session.
  {
    id: "q-uni-cs-algo-1",
    subjectId: "uni-cs-algo",
    topicId: "uni-cs-algo-bigo",
    type: "mcq",
    prompt: "What is the time complexity of binary search on a sorted array of n elements?",
    options: [
      { id: "a", label: "O(n)" },
      { id: "b", label: "O(log n)" },
      { id: "c", label: "O(n log n)" },
      { id: "d", label: "O(1)" },
    ],
    correctOptionId: "b",
    difficulty: 2,
    explanation: "Binary search halves the remaining search space at each step, so the number of steps grows with log₂(n) — giving O(log n).",
    whyWrongByOption: {
      a: "That's linear search's complexity, not binary search's.",
      c: "O(n log n) is typical for comparison-based sorting, not searching a sorted array.",
      d: "O(1) would mean the answer is found in one step regardless of array size — that's only true for a direct index lookup.",
    },
  },
  {
    id: "q-uni-cs-algo-2",
    subjectId: "uni-cs-algo",
    topicId: "uni-cs-algo-stacks-queues",
    type: "mcq",
    prompt: "Which principle governs how elements are removed from a stack?",
    options: [
      { id: "a", label: "FIFO — First In, First Out" },
      { id: "b", label: "LIFO — Last In, First Out" },
      { id: "c", label: "Random access" },
      { id: "d", label: "Priority-based" },
    ],
    correctOptionId: "b",
    difficulty: 1,
    explanation: "A stack only ever removes the most recently added element — Last In, First Out.",
    whyWrongByOption: {
      a: "FIFO describes a queue, not a stack.",
      c: "A stack restricts access to just one end — it's never random access.",
      d: "Plain stacks have no concept of priority; that's a priority queue.",
    },
  },
  // Phase 7d §1c: offline-fallback entries for the second pilot university
  // course, same reasoning as the uni-cs-algo pair above.
  {
    id: "q-uni-mth-calc1-1",
    subjectId: "uni-mth-calc1",
    topicId: "uni-mth-calc1-limits",
    type: "mcq",
    prompt: "What is lim(x→0) sin(x)/x?",
    options: [
      { id: "a", label: "0" },
      { id: "b", label: "1" },
      { id: "c", label: "Undefined" },
      { id: "d", label: "Infinity" },
    ],
    correctOptionId: "b",
    difficulty: 3,
    explanation: "This is a standard limit provable via the squeeze theorem: sin(x)/x approaches 1 as x approaches 0.",
    whyWrongByOption: {
      a: "A common mix-up with sin(0) = 0 itself, not the limit of the ratio.",
      c: "Though it's a 0/0 form, the limit genuinely exists — it doesn't stay undefined.",
      d: "The function is bounded near 0, not growing without bound.",
    },
  },
  {
    id: "q-uni-mth-calc1-2",
    subjectId: "uni-mth-calc1",
    topicId: "uni-mth-calc1-derivatives",
    type: "mcq",
    prompt: "What is the derivative of f(x) = x^3?",
    options: [
      { id: "a", label: "x^2" },
      { id: "b", label: "3x^2" },
      { id: "c", label: "3x^3" },
      { id: "d", label: "x^2 / 3" },
    ],
    correctOptionId: "b",
    difficulty: 1,
    explanation: "By the power rule, d/dx[x^n] = n·x^(n-1), so d/dx[x^3] = 3x^2.",
    whyWrongByOption: {
      a: "Forgot to multiply by the original exponent.",
      c: "Forgot to reduce the exponent by one.",
      d: "Inverts the rule — division instead of multiplication.",
    },
  },
];

// ---- Insights & achievements -------------------------------------------

export const insights: Insight[] = [
  {
    id: "insight-1",
    subjectId: "math",
    topicId: "math-algebra-quad",
    message: "You understand quadratic equations, but time pressure is reducing your score. Try more timed practice this week.",
    kind: "attention",
    date: "2026-10-01",
  },
  {
    id: "insight-2",
    subjectId: "english",
    message: "Your essay structure has improved since your last two submissions.",
    kind: "positive",
    date: "2026-09-29",
  },
  {
    id: "insight-3",
    subjectId: "biology",
    topicId: "bio-genetics",
    message: "A few recent mistakes in Genetics point to a gap in Punnett square method, not memory.",
    kind: "neutral",
    date: "2026-09-28",
  },
];

export const achievements: Achievement[] = [
  { id: "ach-1", title: "6-day streak", description: "You've studied for 6 days in a row.", date: "2026-10-02", icon: "flame" },
  { id: "ach-2", title: "Algebra steady", description: "Simultaneous Equations mastery held strong across 3 sessions.", date: "2026-09-29", icon: "target" },
  { id: "ach-3", title: "First mock completed", description: "Finished your first full JAMB mock exam.", date: "2026-09-20", icon: "trophy" },
];

// ---- Assignments ---------------------------------------------------------

export const assignments: Assignment[] = [
  {
    id: "asg-1",
    title: "Essay: \"The importance of qualitative education in national development\"",
    subjectId: "english",
    topicId: "eng-essay",
    dueDate: "2026-10-04",
    estimatedMinutes: 35,
    format: "essay",
    source: "ai",
    status: "todo",
    objective: "Practice argumentative essay structure under JAMB/WAEC marking standards.",
    instructions: "Write a 450–600 word essay on the given topic. Address content & relevance, organisation, grammar, vocabulary, and register.",
    rubric: [
      { id: "r1", name: "Content & relevance", maxScore: 10 },
      { id: "r2", name: "Organisation", maxScore: 10 },
      { id: "r3", name: "Grammar & mechanics", maxScore: 10 },
      { id: "r4", name: "Vocabulary & register", maxScore: 10 },
    ],
    maxScore: 40,
  },
  {
    id: "asg-2",
    title: "Worksheet: Stoichiometry — mole ratios",
    subjectId: "chemistry",
    topicId: "chem-stoich",
    dueDate: "2026-10-06",
    estimatedMinutes: 20,
    format: "theory",
    source: "ai",
    status: "todo",
    objective: "Build confidence converting between moles, mass, and volume in reactions.",
    instructions: "Show your full working for each question — method marks count even if the final answer is off.",
    rubric: [
      { id: "r1", name: "Method", maxScore: 6 },
      { id: "r2", name: "Final answer accuracy", maxScore: 4 },
    ],
    maxScore: 10,
  },
  {
    id: "asg-3",
    title: "Class assignment: Ecology — energy flow and food chains",
    subjectId: "biology",
    topicId: "bio-ecology",
    dueDate: "2026-09-28",
    estimatedMinutes: 30,
    format: "mixed",
    source: "teacher",
    status: "returned",
    objective: "Assess understanding of energy transfer across trophic levels.",
    instructions: "Answer the objective questions, then explain energy loss between trophic levels in 150 words.",
    rubric: [
      { id: "r1", name: "Objective accuracy", maxScore: 10, score: 9 },
      { id: "r2", name: "Explanation clarity", maxScore: 6, score: 5 },
      { id: "r3", name: "Use of correct terms", maxScore: 4, score: 2 },
    ],
    maxScore: 20,
    totalScore: 16,
    submittedAt: "2026-09-27T18:20:00Z",
    returnedAt: "2026-09-29T09:10:00Z",
    teacherOverride: {
      adjustedScore: 17,
      comment: "Good grasp of the 10% rule — I added a mark back for your diagram, which the AI didn't fully credit.",
      status: "adjusted",
    },
    strengths: [
      "Correctly identified producers, primary and secondary consumers in all three objective questions.",
      "Your explanation of the \"10% rule\" in paragraph 2 was accurate and clearly worded.",
    ],
    improvements: [
      "In your explanation, you wrote \"energy reduces as it moves up\" — be specific: energy is lost as heat through respiration, not simply \"reduced.\"",
      "You didn't mention decomposers, which are part of a complete energy flow description.",
    ],
    nextSteps: [
      "Revisit Ecology → Energy Flow flashcards in your revision queue.",
      "Try the \"decomposers and nutrient cycling\" practice set this week.",
    ],
    modelAnswerExcerpt: "Energy entering an ecosystem through producers is progressively lost as heat at each trophic level, mainly through respiration, with only about 10% transferred to the next level. Decomposers return remaining energy and nutrients to the system by breaking down dead matter.",
  },
  {
    id: "asg-4",
    title: "Redraft: Comprehension passage — inference questions",
    subjectId: "english",
    topicId: "eng-comprehension",
    dueDate: "2026-09-18",
    estimatedMinutes: 15,
    format: "objective",
    source: "ai",
    status: "submitted",
    objective: "Practice drawing inferences from unfamiliar passages.",
    instructions: "Answer all 8 inference questions based on the passage provided.",
    rubric: [{ id: "r1", name: "Accuracy", maxScore: 8 }],
    maxScore: 8,
    submittedAt: "2026-09-18T20:00:00Z",
  },
];

// ---- AI Tutor conversation ------------------------------------------------

export const tutorIntro: ChatMessage[] = [
  {
    id: "m0",
    role: "tutor",
    content: "Hello Amara. I'm here to help you think things through — ask me anything about what you're studying, or tell me where you're stuck.",
    type: "text",
    timestamp: "2026-10-02T07:00:00Z",
  },
];

// ---- Revision queue -------------------------------------------------------
// Biology/Chemistry still queue from this static list — RevisionQueuePage
// merges these with the live FSRS-scheduled items for Math/English.
export const revisionQueue: RevisionItem[] = [
  { id: "rev-2", subjectId: "chemistry", topicId: "chem-stoich", topicName: "Stoichiometry basics", reason: "Struggling recently", estimatedMinutes: 8, mode: "worked-problem", urgencyRank: 2 },
  { id: "rev-3", subjectId: "biology", topicId: "bio-genetics", topicName: "Genetics vocabulary", reason: "Confidence dipped last week", estimatedMinutes: 5, mode: "flashcard", urgencyRank: 3 },
];

// ---- Parent portal ---------------------------------------------------------

export const parentChildren: ParentChild[] = [
  { id: "stu_amara", name: "Amara", exam: "JAMB", examDate: "2026-05-16" },
];

export function getSubject(id: string): Subject | undefined {
  return subjects.find((s) => s.id === id);
}

export function getTopic(id: string): Topic | undefined {
  return topics.find((t) => t.id === id);
}

export function getMasteryForTopic(id: string): MasteryRecord | undefined {
  return masteryRecords.find((m) => m.topicId === id);
}
