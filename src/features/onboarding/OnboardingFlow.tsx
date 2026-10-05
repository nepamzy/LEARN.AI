import { useMemo, useState } from "react";
import { OnboardingShell } from "./OnboardingShell";
import { defaultOnboardingData, EXAM_SUBJECTS, type OnboardingData } from "./types";
import { allowedExamsForLevel } from "../../lib/educationLevel";
import { WelcomeStep } from "./steps/WelcomeStep";
import { EducationLevelStep } from "./steps/EducationLevelStep";
import { ExamStep } from "./steps/ExamStep";
import { UniversityNoticeStep } from "./steps/UniversityNoticeStep";
import { SubjectsStep } from "./steps/SubjectsStep";
import { DateStep } from "./steps/DateStep";
import { GoalStep } from "./steps/GoalStep";
import { DiagnosticInviteStep } from "./steps/DiagnosticInviteStep";
import { DiagnosticQuizStep } from "./steps/DiagnosticQuizStep";
import { AccessibilityStep } from "./steps/AccessibilityStep";
import { NotificationsStep } from "./steps/NotificationsStep";
import { ConsentStep } from "./steps/ConsentStep";
import { CompleteStep } from "./steps/CompleteStep";
import { useAppState } from "../../state/useAppState";
import { loadLocal, removeLocal, saveLocal } from "../../lib/storage";
import { useToast } from "../../components/ui/useToast";

const STEP_IDS = [
  "welcome",
  "education-level",
  "exam",
  "subjects",
  "date",
  "goal",
  "diagnostic-invite",
  "diagnostic-quiz",
  "accessibility",
  "notifications",
  "consent",
  "complete",
] as const;

type StepId = (typeof STEP_IDS)[number];

interface Draft {
  stepIndex: number;
  data: OnboardingData;
}

export function OnboardingFlow() {
  const { setOnboardingComplete, setPrefs } = useAppState();
  const { show } = useToast();

  const draft = useMemo(() => loadLocal<Draft | null>("onboardingDraft", null), []);
  const [data, setData] = useState<OnboardingData>(draft?.data ?? defaultOnboardingData);
  const [stepIndex, setStepIndex] = useState(draft?.stepIndex ?? 0);
  const [levelError, setLevelError] = useState<string>();
  const [examError, setExamError] = useState<string>();
  const [subjectsError, setSubjectsError] = useState<string>();
  const [consentError, setConsentError] = useState<string>();

  function patch(p: Partial<OnboardingData>) {
    setData((d) => ({ ...d, ...p }));
  }

  // Visible steps depend on whether the student chose to take the diagnostic,
  // and — University skips ExamStep entirely (§6: no exam exists to choose) —
  // on whether their education level has one.
  const isUniversity = data.educationLevel === "university";
  function stepIsSkipped(id: StepId) {
    if (id === "diagnostic-quiz") return data.diagnosticChoice !== "taking";
    if (id === "exam") return isUniversity;
    return false;
  }
  const visibleSteps = STEP_IDS.filter((id) => !stepIsSkipped(id));
  const currentId: StepId = STEP_IDS[stepIndex];
  const visibleIndex = visibleSteps.indexOf(currentId);

  function goTo(id: StepId) {
    setStepIndex(STEP_IDS.indexOf(id));
  }

  function next() {
    let idx = stepIndex + 1;
    while (idx < STEP_IDS.length && stepIsSkipped(STEP_IDS[idx])) idx++;
    setStepIndex(Math.min(idx, STEP_IDS.length - 1));
  }

  function back() {
    let idx = stepIndex - 1;
    while (idx > 0 && stepIsSkipped(STEP_IDS[idx])) idx--;
    setStepIndex(Math.max(idx, 0));
  }

  function handleSaveLater() {
    saveLocal<Draft>("onboardingDraft", { stepIndex, data });
    saveLocal("onboardingSkipped", true);
    setOnboardingComplete(true);
    show("Saved. Pick up where you left off anytime from your profile.", "info");
  }

  function finish() {
    removeLocal("onboardingDraft");
    removeLocal("onboardingSkipped");
    setPrefs({
      language: data.language,
      notificationsEnabled: data.notificationsChoice === "granted",
      // Overrides the demo student's level everywhere that reads
      // effectiveEducationLevel() (lib/educationLevel.ts) — null here would
      // mean "no override", but finishing onboarding always sets one.
      educationLevel: data.educationLevel,
    });
    setOnboardingComplete(true);
  }

  return (
    <OnboardingShell
      stepIndex={Math.max(visibleIndex, 0)}
      stepCount={visibleSteps.length}
      onBack={stepIndex > 0 ? back : undefined}
      onSaveLater={currentId !== "welcome" && currentId !== "complete" ? handleSaveLater : undefined}
    >
      {currentId === "welcome" && <WelcomeStep onNext={next} />}

      {currentId === "education-level" && (
        <EducationLevelStep
          value={data.educationLevel}
          error={levelError}
          onChange={(educationLevel) => {
            // Changing level invalidates whatever exam/subjects were picked
            // under a previous level — clear them so a stale JAMB selection
            // can't survive a switch to Primary, for instance.
            patch({ educationLevel, exam: null, subjects: [] });
            setLevelError(undefined);
          }}
          onNext={() => (data.educationLevel ? next() : setLevelError("Choose a level to continue."))}
        />
      )}

      {currentId === "exam" && (
        <ExamStep
          value={data.exam}
          allowedExams={data.educationLevel ? allowedExamsForLevel(data.educationLevel) : []}
          error={examError}
          onChange={(exam) => {
            patch({ exam, subjects: EXAM_SUBJECTS[exam] ?? [] });
            setExamError(undefined);
          }}
          onNext={() => (data.exam ? next() : setExamError("Choose an exam to continue."))}
        />
      )}

      {currentId === "subjects" && isUniversity && <UniversityNoticeStep onNext={next} />}

      {currentId === "subjects" && !isUniversity && (
        <SubjectsStep
          value={data.subjects}
          allowedSubjectIds={data.exam ? (EXAM_SUBJECTS[data.exam] ?? []) : []}
          error={subjectsError}
          onChange={(subjects) => {
            patch({ subjects });
            setSubjectsError(undefined);
          }}
          onNext={() => (data.subjects.length > 0 ? next() : setSubjectsError("Pick at least one subject."))}
        />
      )}

      {currentId === "date" && (
        <DateStep
          value={data.examDate}
          unknown={data.examDateUnknown}
          onChangeDate={(examDate) => patch({ examDate })}
          onToggleUnknown={(examDateUnknown) => patch({ examDateUnknown, examDate: examDateUnknown ? "" : data.examDate })}
          onNext={next}
        />
      )}

      {currentId === "goal" && (
        <GoalStep
          value={data.goalPace}
          customMinutes={data.customMinutes}
          onChange={(goalPace) => patch({ goalPace })}
          onCustomMinutesChange={(customMinutes) => patch({ customMinutes })}
          onNext={next}
        />
      )}

      {currentId === "diagnostic-invite" && (
        <DiagnosticInviteStep
          onStart={() => {
            patch({ diagnosticChoice: "taking" });
            goTo("diagnostic-quiz");
          }}
          onSkip={() => {
            patch({ diagnosticChoice: "skipped" });
            next();
          }}
        />
      )}

      {currentId === "diagnostic-quiz" && (
        <DiagnosticQuizStep
          onFinish={(diagnosticCorrect, diagnosticTotal) => {
            patch({ diagnosticChoice: "done", diagnosticCorrect, diagnosticTotal });
            next();
          }}
        />
      )}

      {currentId === "accessibility" && (
        <AccessibilityStep
          language={data.language}
          onChange={(language) => patch({ language: language === "later" ? "en" : language })}
          onNext={next}
        />
      )}

      {currentId === "notifications" && (
        <NotificationsStep
          onChoice={(notificationsChoice) => {
            patch({ notificationsChoice });
            next();
          }}
        />
      )}

      {currentId === "consent" && (
        <ConsentStep
          isUnderage={data.isUnderage}
          guardianEmail={data.guardianEmail}
          error={consentError}
          onSetUnderage={(isUnderage) => patch({ isUnderage })}
          onGuardianEmailChange={(guardianEmail) => {
            patch({ guardianEmail });
            setConsentError(undefined);
          }}
          onNext={() => {
            if (data.isUnderage && !data.guardianEmail.includes("@")) {
              setConsentError("Enter a valid email so we can request consent.");
              return;
            }
            next();
          }}
        />
      )}

      {currentId === "complete" && <CompleteStep data={data} onFinish={finish} />}
    </OnboardingShell>
  );
}
