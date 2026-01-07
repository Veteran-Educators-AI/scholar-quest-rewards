import { Toaster } from "@/components/ui/toaster";
import TeacherVerify from "./pages/TeacherVerify";
import ParentDashboard from "./pages/ParentDashboard";
import Leaderboard from "./pages/Leaderboard";
import Challenges from "./pages/Challenges";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import StudentHome from "./pages/StudentHome";
import StudentProfile from "./pages/StudentProfile";
import Rewards from "./pages/Rewards";
import AssignmentDetail from "./pages/AssignmentDetail";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherIntegrations from "./pages/TeacherIntegrations";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/student" element={<StudentHome />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/student/rewards" element={<Rewards />} />
            <Route path="/student/leaderboard" element={<Leaderboard />} />
            <Route path="/student/challenges" element={<Challenges />} />
            <Route path="/student/assignment/:id" element={<AssignmentDetail />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/integrations" element={<TeacherIntegrations />} />
            <Route path="/teacher/verify" element={<TeacherVerify />} />
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
