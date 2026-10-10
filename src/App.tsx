import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AppStateProvider } from "./state/AppStateContext";
import { AuthProvider } from "./state/AuthContext";
import { useAppState } from "./state/useAppState";
import { ToastProvider } from "./components/ui/Toast";
import { AuthGate } from "./features/auth/AuthGate";

import { OnboardingFlow } from "./features/onboarding/OnboardingFlow";
import { HomePage } from "./features/home/HomePage";
import { LearnPage } from "./features/learn/LearnPage";
import { PracticeSetupPage } from "./features/practice/PracticeSetupPage";
import { PracticeSessionPage } from "./features/practice/PracticeSessionPage";
import { PracticeResultsPage } from "./features/practice/PracticeResultsPage";
import { ExamSimulatorSelectPage } from "./features/examsimulator/ExamSimulatorSelectPage";
import { ExamSimulatorSetupPage } from "./features/examsimulator/ExamSimulatorSetupPage";
import { ExamSimulatorIntroPage } from "./features/examsimulator/ExamSimulatorIntroPage";
import { ExamSimulatorSessionPage } from "./features/examsimulator/ExamSimulatorSessionPage";
import { ExamSimulatorResultsPage } from "./features/examsimulator/ExamSimulatorResultsPage";
import { TutorPage } from "./features/tutor/TutorPage";
import { AssignmentsPage } from "./features/assignments/AssignmentsPage";
import { AssignmentDetailPage } from "./features/assignments/AssignmentDetailPage";
import { AssignmentReportPage } from "./features/assignments/AssignmentReportPage";
import { ProgressPage } from "./features/progress/ProgressPage";
import { TopicDetailPage } from "./features/progress/TopicDetailPage";
import { RevisionQueuePage } from "./features/revision/RevisionQueuePage";
import { ProfilePage } from "./features/profile/ProfilePage";
import { MorePage } from "./features/profile/MorePage";
import { ParentPortalPage } from "./features/parent/ParentPortalPage";
import { TeacherDashboardPage } from "./features/teacher/TeacherDashboardPage";

function Gate() {
  const { onboardingComplete } = useAppState();
  if (!onboardingComplete) return <OnboardingFlow />;

  return (
    <Routes>
      {/* Distraction-free, full-screen session views render without the app chrome
          (sidebar/bottom nav/top bar) so exiting always goes through their own
          exit-confirmation dialog rather than a nav tap. */}
      <Route path="practice/session" element={<PracticeSessionPage />} />
      <Route path="exam/session" element={<ExamSimulatorSessionPage />} />

      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="learn" element={<LearnPage />} />
        <Route path="practice" element={<PracticeSetupPage />} />
        <Route path="practice/results" element={<PracticeResultsPage />} />
        <Route path="exam" element={<ExamSimulatorSelectPage />} />
        <Route path="exam/setup" element={<ExamSimulatorSetupPage />} />
        <Route path="exam/intro" element={<ExamSimulatorIntroPage />} />
        <Route path="exam/results" element={<ExamSimulatorResultsPage />} />
        <Route path="tutor" element={<TutorPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="assignments/:id" element={<AssignmentDetailPage />} />
        <Route path="assignments/:id/report" element={<AssignmentReportPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="progress/topic/:id" element={<TopicDetailPage />} />
        <Route path="revision" element={<RevisionQueuePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="more" element={<MorePage />} />
        <Route path="parent" element={<ParentPortalPage />} />
        <Route path="teacher" element={<TeacherDashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppStateProvider>
        <ToastProvider>
          <BrowserRouter>
            <AuthGate>
              <Gate />
            </AuthGate>
          </BrowserRouter>
        </ToastProvider>
      </AppStateProvider>
    </AuthProvider>
  );
}

export default App;
