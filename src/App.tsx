import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { StudyTimerProvider } from "@/contexts/StudyTimerContext";
import { AuthRedirectWrapper } from "@/components/AuthRedirectWrapper";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import PageLoader from "./components/PageLoader";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";

const TeacherVerify = lazy(() => import("./pages/TeacherVerify"));
const ParentDashboard = lazy(() => import("./pages/ParentDashboard"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Challenges = lazy(() => import("./pages/Challenges"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const StudentHome = lazy(() => import("./pages/StudentHome"));
const StudentOnboarding = lazy(() => import("./pages/StudentOnboarding"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const Rewards = lazy(() => import("./pages/Rewards"));
const AssignmentDetail = lazy(() => import("./pages/AssignmentDetail"));
const Support = lazy(() => import("./pages/Support"));
const GradingResult = lazy(() => import("./pages/GradingResult"));
const PracticeSet = lazy(() => import("./pages/PracticeSet"));
const PracticeCenter = lazy(() => import("./pages/PracticeCenter"));
const PracticeExercise = lazy(() => import("./pages/PracticeExercise"));
const PrintableWorksheet = lazy(() => import("./pages/PrintableWorksheet"));
const RewardsEarned = lazy(() => import("./pages/RewardsEarned"));
const NotificationCenter = lazy(() => import("./pages/NotificationCenter"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const TeacherIntegrations = lazy(() => import("./pages/TeacherIntegrations"));
const TeacherRaffle = lazy(() => import("./pages/TeacherRaffle"));
const TeacherStudents = lazy(() => import("./pages/TeacherStudents"));
const TeacherAssignmentBuilder = lazy(() => import("./pages/TeacherAssignmentBuilder"));
const APISettings = lazy(() => import("./pages/APISettings"));
const Raffle = lazy(() => import("./pages/Raffle"));
const GameCenter = lazy(() => import("./pages/GameCenter"));
const PlayGame = lazy(() => import("./pages/PlayGame"));
const RegentsPrep = lazy(() => import("./pages/RegentsPrep"));
const StudyPlan = lazy(() => import("./pages/StudyPlan"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <StudyTimerProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthRedirectWrapper>
                <AppErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Landing />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/student" element={<StudentHome />} />
                      <Route path="/student/onboarding" element={<StudentOnboarding />} />
                      <Route path="/student/profile" element={<StudentProfile />} />
                      <Route path="/student/rewards" element={<Rewards />} />
                      <Route path="/student/leaderboard" element={<Leaderboard />} />
                      <Route path="/student/challenges" element={<Challenges />} />
                      <Route path="/student/assignment/:id" element={<AssignmentDetail />} />
                      <Route path="/student/support" element={<Support />} />
                      <Route path="/student/grading" element={<GradingResult />} />
                      <Route path="/student/practice" element={<PracticeSet />} />
                      <Route path="/student/practice-center" element={<PracticeCenter />} />
                      <Route path="/student/practice/:id" element={<PracticeExercise />} />
                      <Route path="/student/practice/:id/print" element={<PrintableWorksheet />} />
                      <Route path="/student/rewards-earned" element={<RewardsEarned />} />
                      <Route path="/student/raffle" element={<Raffle />} />
                      <Route path="/student/notifications" element={<NotificationCenter />} />
                      <Route path="/games" element={<GameCenter />} />
                      <Route path="/games/:id" element={<PlayGame />} />
                      <Route path="/regents-prep" element={<RegentsPrep />} />
                      <Route path="/study-plan" element={<StudyPlan />} />
                      <Route path="/teacher" element={<TeacherDashboard />} />
                      <Route path="/teacher/students" element={<TeacherStudents />} />
                      <Route path="/teacher/integrations" element={<TeacherIntegrations />} />
                      <Route path="/teacher/verify" element={<TeacherVerify />} />
                      <Route path="/teacher/raffle" element={<TeacherRaffle />} />
                      <Route path="/teacher/assignments/new" element={<TeacherAssignmentBuilder />} />
                      <Route path="/teacher/api" element={<APISettings />} />
                      <Route path="/parent" element={<ParentDashboard />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/terms-of-service" element={<TermsOfService />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </AppErrorBoundary>
              </AuthRedirectWrapper>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </StudyTimerProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
