import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { StudyTimerProvider } from "@/contexts/StudyTimerContext";
import TeacherVerify from "./pages/TeacherVerify";
import ParentDashboard from "./pages/ParentDashboard";
import Leaderboard from "./pages/Leaderboard";
import Challenges from "./pages/Challenges";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import StudentHome from "./pages/StudentHome";
import StudentOnboarding from "./pages/StudentOnboarding";
import StudentProfile from "./pages/StudentProfile";
import Rewards from "./pages/Rewards";
import AssignmentDetail from "./pages/AssignmentDetail";
import Support from "./pages/Support";
import GradingResult from "./pages/GradingResult";
import PracticeSet from "./pages/PracticeSet";
import RewardsEarned from "./pages/RewardsEarned";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherIntegrations from "./pages/TeacherIntegrations";
import APISettings from "./pages/APISettings";
import NotFound from "./pages/NotFound";

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
                <Route path="/student/rewards-earned" element={<RewardsEarned />} />
                <Route path="/teacher" element={<TeacherDashboard />} />
                <Route path="/teacher/integrations" element={<TeacherIntegrations />} />
                <Route path="/teacher/verify" element={<TeacherVerify />} />
                <Route path="/teacher/api" element={<APISettings />} />
                <Route path="/parent" element={<ParentDashboard />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </StudyTimerProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
