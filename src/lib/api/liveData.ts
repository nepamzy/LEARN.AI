// The real data layer for Math/English: reads/writes Supabase, and runs
// every practice attempt through the BKT+FSRS engine (src/lib/engine).
// Everything here mirrors the shapes in src/lib/types.ts so the UI components
// barely had to change — see MasteryMapSection, TopicDetailPage,
// RevisionQueuePage, PracticeSessionPage, ExamSimulatorSessionPage.

import { supabase, DEMO_STUDENT_ID, LIVE_SUBJECT_IDS } from "../supabase";
import { applyAttempt, type MasteryRow } from "../engine/mastery";
import { getTopic } from "../mockData";
import type { MasteryRecord, MistakeType, Question, RevisionItem } from "../types";
import { enqueueAttempt, type QueuedAttempt } from "./offlineQueue";

// ---- Row <-> domain mapping ------------------------------------------------

interface MasteryRecordRow {
  student_id: string;
  topic_id: string;
  mastery_probability: number;
  status: MasteryRecord["status"];
  trend: MasteryRecord["trend"];
  questions_attempted: number;
  last_practiced: string | null;
  confidence: MasteryRecord["confidence"];
  fsrs_stability: number;
  fsrs_difficulty: number;
  fsrs_reps: number;
  fsrs_lapses: number;
  next_review_due: string | null;
  updated_at: string;
}

function rowToMasteryRecord(row: MasteryRecordRow): MasteryRecord {
  return {
    topicId: row.topic_id,
    status: row.status,
    masteryProbability: row.mastery_probability,
    trend: row.trend,
    questionsAttempted: row.questions_attempted,
    lastPracticed: row.last_practiced ?? undefined,
    nextReviewDue: row.next_review_due ?? undefined,
    confidence: row.confidence,
  };
}

interface QuestionRow {
  id: string;
  subject_id: string;
  topic_id: string;
  type: Question["type"];
  prompt: string;
  options: Question["options"];
  correct_option_id: string | null;
  difficulty: Question["difficulty"];
  explanation: string;
  why_wrong_by_option: Question["whyWrongByOption"];
  worked_example: string | null;
}

function rowToQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    subjectId: row.subject_id,
    topicId: row.topic_id,
    type: row.type,
    prompt: row.prompt,
    options: row.options ?? undefined,
    correctOptionId: row.correct_option_id ?? undefined,
    difficulty: row.difficulty,
    explanation: row.explanation,
    whyWrongByOption: row.why_wrong_by_option ?? undefined,
    workedExample: row.worked_example ?? undefined,
  };
}

// ---- Reads ------------------------------------------------------------

export async function fetchLiveQuestions(subjectId: string): Promise<Question[]> {
  const { data, error } = await supabase.from("questions").select("*").eq("subject_id", subjectId);
  if (error) throw error;
  return (data as QuestionRow[]).map(rowToQuestion);
}

/** One representative question for a topic (used by the revision mini-quiz/worked-problem modes). */
export async function fetchLiveQuestionForTopic(topicId: string): Promise<Question | undefined> {
  const { data, error } = await supabase.from("questions").select("*").eq("topic_id", topicId).limit(1).maybeSingle();
  if (error) throw error;
  return data ? rowToQuestion(data as QuestionRow) : undefined;
}

/** Mastery for every live topic in a subject, defaulting topics with no attempts yet to "support". */
export async function fetchLiveMasteryForSubject(subjectId: string): Promise<MasteryRecord[]> {
  const { data: topicRows, error: topicsError } = await supabase.from("topics").select("id").eq("subject_id", subjectId);
  if (topicsError) throw topicsError;

  const { data: masteryRows, error: masteryError } = await supabase
    .from("mastery_records")
    .select("*")
    .eq("student_id", DEMO_STUDENT_ID)
    .in(
      "topic_id",
      (topicRows ?? []).map((t) => t.id)
    );
  if (masteryError) throw masteryError;

  const byTopic = new Map((masteryRows as MasteryRecordRow[]).map((r) => [r.topic_id, r]));

  return (topicRows ?? []).map(({ id: topicId }) => {
    const row = byTopic.get(topicId);
    if (row) return rowToMasteryRecord(row);
    return {
      topicId,
      status: "support",
      masteryProbability: 0.3,
      trend: "flat",
      questionsAttempted: 0,
      confidence: "low",
    };
  });
}

export async function fetchLiveMasteryForTopic(topicId: string): Promise<MasteryRecord | undefined> {
  const { data, error } = await supabase
    .from("mastery_records")
    .select("*")
    .eq("student_id", DEMO_STUDENT_ID)
    .eq("topic_id", topicId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToMasteryRecord(data as MasteryRecordRow) : undefined;
}

const MODE_BY_STATUS: Record<MasteryRecord["status"], RevisionItem["mode"]> = {
  support: "worked-problem",
  review: "mini-quiz",
  building: "mini-quiz",
  strong: "recap",
};

/** Topics due today or overdue, across every live subject, ranked most-overdue first. */
export async function fetchLiveRevisionQueue(today: string): Promise<RevisionItem[]> {
  const { data, error } = await supabase
    .from("mastery_records")
    .select("*")
    .eq("student_id", DEMO_STUDENT_ID)
    .lte("next_review_due", today)
    .not("next_review_due", "is", null)
    .order("next_review_due", { ascending: true });
  if (error) throw error;

  return (data as MasteryRecordRow[]).map((row, i) => {
    const topic = getTopic(row.topic_id);
    const daysOverdue = Math.max(0, Math.round((Date.parse(today) - Date.parse(row.next_review_due!)) / 86_400_000));
    return {
      id: `live-${row.topic_id}`,
      subjectId: topic?.subjectId ?? "",
      topicId: row.topic_id,
      topicName: topic?.name ?? row.topic_id,
      reason:
        daysOverdue > 0 ? `Overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}` : "Due for review today",
      estimatedMinutes: row.status === "support" ? 8 : row.status === "review" ? 6 : 5,
      mode: MODE_BY_STATUS[row.status],
      urgencyRank: i + 1,
    };
  });
}

// ---- Writes -------------------------------------------------------------

export interface SubmitAttemptParams {
  question: Question;
  selectedOptionId: string | undefined;
  isCorrect: boolean;
  timeSeconds: number;
  flagged: boolean;
  now: Date;
}

export interface SubmitAttemptResult {
  mistakeType: MistakeType | undefined;
  mastery: MasteryRow;
  queued: boolean;
}

/**
 * Read prior mastery + attempt history for a topic, run one new observation
 * through BKT+FSRS, and write both the raw attempt and the updated mastery
 * row. Shared by the live submit path and the offline-queue flush, so a
 * queued attempt updates mastery exactly the same way a live one would —
 * read-modify-write against the single mastery_records row, never replayed
 * from the full log (see the Phase 2 note's risk list for what that implies
 * if two attempts for the same topic are ever written concurrently).
 */
async function runAttemptOrchestration(
  topicId: string,
  difficulty: number,
  isCorrect: boolean,
  timeSeconds: number,
  questionId: string,
  selectedOptionId: string | undefined,
  flagged: boolean,
  now: Date
): Promise<{ mistakeType: MistakeType | undefined; mastery: MasteryRow }> {
  const [{ data: priorAttemptsData, error: priorError }, { data: currentRow, error: currentError }] = await Promise.all([
    supabase
      .from("practice_attempts")
      .select("is_correct, created_at")
      .eq("student_id", DEMO_STUDENT_ID)
      .eq("topic_id", topicId)
      .order("created_at", { ascending: false }),
    supabase.from("mastery_records").select("*").eq("student_id", DEMO_STUDENT_ID).eq("topic_id", topicId).maybeSingle(),
  ]);
  if (priorError) throw priorError;
  if (currentError) throw currentError;

  const priorAttempts = (priorAttemptsData ?? []).map((a) => ({ isCorrect: a.is_correct as boolean }));
  const lastReviewedAt = priorAttemptsData?.[0]?.created_at as string | undefined;
  const elapsedDaysSinceLastReview = lastReviewedAt
    ? Math.max(0, (now.getTime() - Date.parse(lastReviewedAt)) / 86_400_000)
    : 0;

  const prevRow: MasteryRow | null = currentRow
    ? {
        masteryProbability: currentRow.mastery_probability,
        status: currentRow.status,
        trend: currentRow.trend,
        questionsAttempted: currentRow.questions_attempted,
        confidence: currentRow.confidence,
        fsrs: {
          stability: currentRow.fsrs_stability,
          difficulty: currentRow.fsrs_difficulty,
          reps: currentRow.fsrs_reps,
          lapses: currentRow.fsrs_lapses,
        },
        nextReviewDue: currentRow.next_review_due ?? now.toISOString().slice(0, 10),
      }
    : null;

  const { row: nextRow, mistakeType } = applyAttempt(prevRow, {
    isCorrect,
    difficulty,
    timeSeconds,
    priorAttempts,
    elapsedDaysSinceLastReview,
    now,
  });

  const { error: insertError } = await supabase.from("practice_attempts").insert({
    student_id: DEMO_STUDENT_ID,
    question_id: questionId,
    topic_id: topicId,
    selected_option_id: selectedOptionId ?? null,
    is_correct: isCorrect,
    mistake_type: mistakeType ?? null,
    time_seconds: timeSeconds,
    flagged,
    created_at: now.toISOString(),
  });
  if (insertError) throw insertError;

  const { error: upsertError } = await supabase.from("mastery_records").upsert({
    student_id: DEMO_STUDENT_ID,
    topic_id: topicId,
    mastery_probability: nextRow.masteryProbability,
    status: nextRow.status,
    trend: nextRow.trend,
    questions_attempted: nextRow.questionsAttempted,
    last_practiced: now.toISOString(),
    confidence: nextRow.confidence,
    fsrs_stability: nextRow.fsrs.stability,
    fsrs_difficulty: nextRow.fsrs.difficulty,
    fsrs_reps: nextRow.fsrs.reps,
    fsrs_lapses: nextRow.fsrs.lapses,
    next_review_due: nextRow.nextReviewDue,
    updated_at: now.toISOString(),
  });
  if (upsertError) throw upsertError;

  return { mistakeType, mastery: nextRow };
}

/**
 * Full path for one live-subject attempt, with an offline fallback: if either
 * write fails (no connection, RLS, etc.) the attempt is queued locally and a
 * locally-computed result is still returned so the UI isn't blocked.
 */
export async function submitLiveAttempt(params: SubmitAttemptParams): Promise<SubmitAttemptResult> {
  const { question, selectedOptionId, isCorrect, timeSeconds, flagged, now } = params;
  try {
    const { mistakeType, mastery } = await runAttemptOrchestration(
      question.topicId,
      question.difficulty,
      isCorrect,
      timeSeconds,
      question.id,
      selectedOptionId,
      flagged,
      now
    );
    return { mistakeType, mastery, queued: false };
  } catch {
    const queued: QueuedAttempt = {
      localId: crypto.randomUUID(),
      studentId: DEMO_STUDENT_ID,
      questionId: question.id,
      topicId: question.topicId,
      subjectId: question.subjectId,
      selectedOptionId,
      isCorrect,
      timeSeconds,
      flagged,
      createdAt: now.toISOString(),
    };
    enqueueAttempt(queued);
    // Still compute locally (against whatever we know) so the session's
    // results screen has numbers to show immediately, even offline.
    const { row } = applyAttempt(null, {
      isCorrect,
      difficulty: question.difficulty,
      timeSeconds,
      priorAttempts: [],
      elapsedDaysSinceLastReview: 0,
      now,
    });
    return { mistakeType: undefined, mastery: row, queued: true };
  }
}

/** Re-run one previously-queued offline attempt through the same orchestration. */
export async function resubmitQueuedAttempt(queued: QueuedAttempt): Promise<void> {
  const { data: questionRow, error } = await supabase.from("questions").select("difficulty").eq("id", queued.questionId).single();
  if (error) throw error;

  await runAttemptOrchestration(
    queued.topicId,
    (questionRow as { difficulty: number }).difficulty,
    queued.isCorrect,
    queued.timeSeconds,
    queued.questionId,
    queued.selectedOptionId,
    queued.flagged,
    new Date(queued.createdAt)
  );
}

export { LIVE_SUBJECT_IDS };
