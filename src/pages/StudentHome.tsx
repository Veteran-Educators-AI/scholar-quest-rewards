import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CoinCounter } from "@/components/CoinCounter";
import { NotificationBell } from "@/components/NotificationBell";
import { LanguageSelector } from "@/components/LanguageSelector";
import { GuidedTour } from "@/components/GuidedTour";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Trophy, LogOut, BookOpen, Target, TrendingUp, 
  Home, Award, Zap, BarChart3, Flame, Loader2,
  GraduationCap, Brain, Sparkles, ChevronRight,
  AlertTriangle, Gamepad2, RefreshCw, Clock
} from "lucide-react";
import { PoweredByFooter } from "@/components/PoweredByFooter";
import highschoolLogo from "@/assets/highschool-logo-new.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { StudentHomeSkeleton } from "@/components/skeletons/StudentHomeSkeleton";
import { PrefetchLink } from "@/components/PrefetchLink";
import { prefetchRoutes } from "@/hooks/usePrefetch";

interface ExternalStudentData {
  full_name: string;
  overall_average: number | null;
  grades: any[];
  weak_topics: any[];
  misconceptions: any[];
  class_name: string | null;
  teacher_name: string | null;
  remediation_recommendations: any[];
}

interface StudentProfileData {
  coins: number;
  xp: number;
  current_streak: number;
  streak_shield_available: boolean;
  grade_level: number | null;
}

interface PriorityArea {
  standardCode: string;
  subject: string;
  topic: string;
  reason: string;
  currentLevel: string;
  urgency: string;
  suggestedTime: string;
}

interface StudyPlanData {
  summary: string;
  priorityAreas: PriorityArea[];
  weeklyGoals: any[];
  dailySchedule: any[];
  encouragement: string;
}

interface RewardPledge {
  id: string;
  coin_threshold: number;
  reward_description: string;
  reward_type: string;
}

export default function StudentHome() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [externalData, setExternalData] = useState<ExternalStudentData | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfileData | null>(null);
  const [userName, setUserName] = useState("Scholar");
  const [studyPlan, setStudyPlan] = useState<StudyPlanData | null>(null);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [nextReward, setNextReward] = useState<RewardPledge | null>(null);

  useEffect(() => {
    fetchUserData();
    // Prefetch common student routes after initial load
    const timer = setTimeout(() => {
      prefetchRoutes([
        '/student/practice-center',
        '/student/rewards',
        '/student/leaderboard',
        '/games',
        '/regents-prep',
        '/student/challenges',
      ]);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("scholar_tour_completed");
    if (!hasSeenTour && !loading) {
      setShowTour(true);
    }
  }, [loading]);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      
      if (profile?.full_name) {
        setUserName(profile.full_name);
      }

      // Fetch student profile
      const { data: studentProf } = await supabase
        .from("student_profiles")
        .select("xp, coins, current_streak, streak_shield_available, grade_level")
        .eq("user_id", user.id)
        .single();

      if (studentProf && studentProf.grade_level === null) {
        navigate("/student/onboarding");
        return;
      }
      
      setStudentProfile(studentProf);

      // Fetch external student data (NYCologic)
      const { data: externalStudent } = await supabase
        .from("external_students")
        .select("*")
        .eq("linked_user_id", user.id)
        .maybeSingle();

      if (externalStudent) {
        setExternalData(externalStudent as ExternalStudentData);
      }

      // Fetch next reward pledge
      const coins = studentProf?.coins || 0;
      const { data: pledges } = await supabase
        .from("parent_point_pledges")
        .select("id, coin_threshold, reward_description, reward_type")
        .eq("student_id", user.id)
        .eq("is_active", true)
        .eq("claimed", false)
        .gt("coin_threshold", coins)
        .order("coin_threshold", { ascending: true })
        .limit(1);

      if (pledges && pledges.length > 0) {
        setNextReward(pledges[0]);
      }

      // Load cached study plan
      const cached = localStorage.getItem(`study_plan_${user.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setStudyPlan(parsed.studyPlan);
      }

    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    setGeneratingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-study-plan");

      if (error) throw error;

      if (data.error) {
        if (data.error.includes("Rate limit")) {
          toast({
            title: "Please wait",
            description: "Too many requests. Try again in a minute.",
            variant: "destructive",
          });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setStudyPlan(data.studyPlan);

      // Cache the plan
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        localStorage.setItem(`study_plan_${user.id}`, JSON.stringify({
          studyPlan: data.studyPlan,
          generatedAt: data.generatedAt,
        }));
      }

      toast({
        title: "Suggestions updated! 📚",
        description: "Here's what you should focus on.",
      });
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast({
        title: "Failed to generate suggestions",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem("scholar_tour_completed", "true");
    toast({
      title: "Welcome aboard!",
      description: "Complete practice to earn XP and level up.",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: t.studentHome.logoutTitle,
      description: t.studentHome.logoutMessage,
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.greeting.morning;
    if (hour < 17) return t.greeting.afternoon;
    return t.greeting.evening;
  };

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return "text-muted-foreground";
    if (grade >= 90) return "text-green-600";
    if (grade >= 80) return "text-blue-600";
    if (grade >= 70) return "text-yellow-600";
    if (grade >= 65) return "text-orange-600";
    return "text-red-600";
  };

  const getGradeBadgeColor = (grade: number | null) => {
    if (grade === null) return "bg-muted text-muted-foreground";
    if (grade >= 90) return "bg-green-500/20 text-green-700 dark:text-green-400";
    if (grade >= 80) return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
    if (grade >= 70) return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
    if (grade >= 65) return "bg-orange-500/20 text-orange-700 dark:text-orange-400";
    return "bg-red-500/20 text-red-700 dark:text-red-400";
  };

  if (loading) {
    return <StudentHomeSkeleton />;
  }

  const coins = studentProfile?.coins || 0;
  const xp = studentProfile?.xp || 0;
  const level = Math.floor(xp / 500) + 1;
  const xpInLevel = xp - ((level - 1) * 500);
  const progressPercent = (xpInLevel / 500) * 100;
  const streak = studentProfile?.current_streak || 0;

  // Calculate progress to next reward
  const nextRewardProgress = nextReward 
    ? Math.min((coins / nextReward.coin_threshold) * 100, 100)
    : 0;
  const coinsNeeded = nextReward ? nextReward.coin_threshold - coins : 0;

  return (
    <>
      <GuidedTour isOpen={showTour} onComplete={handleTourComplete} />
      
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <PrefetchLink to="/student/profile" className="flex items-center gap-3 group">
                <div className="relative">
                  <img 
                    src={highschoolLogo} 
                    alt="Scholar" 
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="w-10 h-10 object-contain"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[8px] font-bold text-primary-foreground border-2 border-card">
                    {level}
                  </div>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {userName}
                  </p>
                  <p className="text-xs text-muted-foreground">Level {level}</p>
                </div>
              </PrefetchLink>
              
              <div className="flex items-center gap-1 sm:gap-2">
                <ThemeToggle />
                <LanguageSelector />
                <CoinCounter coins={coins} size="sm" />
                <NotificationBell />
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Section 1: Performance Stats */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-gradient-to-br from-secondary via-secondary to-secondary/95 rounded-2xl p-6 text-secondary-foreground overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                <p className="text-secondary-foreground/60 text-sm font-medium tracking-wide uppercase mb-1">
                  {getGreeting()}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                  {userName.split(' ')[0]}, here's your progress
                </h1>

                {/* Class Grade & Standing */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-secondary-foreground/5 backdrop-blur-sm rounded-lg p-3 border border-secondary-foreground/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      <span className="text-xs text-secondary-foreground/60 font-medium">Class Grade</span>
                    </div>
                    <p className={`text-2xl font-bold tabular-nums ${getGradeColor(externalData?.overall_average ?? null)}`}>
                      {externalData?.overall_average !== null && externalData?.overall_average !== undefined 
                        ? `${Math.round(externalData.overall_average)}%` 
                        : "—"}
                    </p>
                  </div>
                  
                  <div className="bg-secondary-foreground/5 backdrop-blur-sm rounded-lg p-3 border border-secondary-foreground/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Flame className="w-4 h-4 text-streak" />
                      <span className="text-xs text-secondary-foreground/60 font-medium">Streak</span>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{streak}d</p>
                  </div>
                  
                  <div className="bg-secondary-foreground/5 backdrop-blur-sm rounded-lg p-3 border border-secondary-foreground/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Trophy className="w-4 h-4 text-gold" />
                      <span className="text-xs text-secondary-foreground/60 font-medium">XP Level</span>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{level}</p>
                  </div>
                  
                  <div className="bg-secondary-foreground/5 backdrop-blur-sm rounded-lg p-3 border border-secondary-foreground/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Target className="w-4 h-4 text-warning" />
                      <span className="text-xs text-secondary-foreground/60 font-medium">Weak Areas</span>
                    </div>
                    <p className="text-2xl font-bold tabular-nums text-warning">
                      {externalData?.weak_topics?.length || 0}
                    </p>
                  </div>
                </div>

                {/* Progress to Next Reward */}
                {nextReward && (
                  <div className="bg-secondary-foreground/5 backdrop-blur-sm rounded-xl p-4 border border-secondary-foreground/10">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-gold" />
                        <span className="text-sm font-medium text-secondary-foreground/80">
                          Next Reward: {nextReward.reward_description}
                        </span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {coinsNeeded} coins to go!
                      </span>
                    </div>
                    <div className="h-2 bg-secondary-foreground/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${nextRewardProgress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-gold via-gold to-warning rounded-full"
                      />
                    </div>
                    <p className="text-xs text-secondary-foreground/60 mt-2">
                      {coins} / {nextReward.coin_threshold} coins
                    </p>
                  </div>
                )}

                {/* Weak Topics Preview */}
                {externalData?.weak_topics && externalData.weak_topics.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-secondary-foreground/60 mb-2">Areas needing work:</p>
                    <div className="flex flex-wrap gap-2">
                      {externalData.weak_topics.slice(0, 4).map((topic: any, i: number) => (
                        <Badge
                          key={i}
                          className="bg-orange-500/20 text-orange-200 border-orange-500/30 text-xs"
                        >
                          {typeof topic === "string" ? topic : topic.name || topic.topic || "—"}
                        </Badge>
                      ))}
                      {externalData.weak_topics.length > 4 && (
                        <Badge variant="outline" className="text-xs border-secondary-foreground/30">
                          +{externalData.weak_topics.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {/* Section 2: AI-Powered Improvement Suggestions */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Your Next Steps
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={generateSuggestions}
                    disabled={generatingSuggestions}
                    className="h-8"
                  >
                    {generatingSuggestions ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!studyPlan ? (
                  <div className="text-center py-6">
                    <Brain className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">
                      Get personalized suggestions based on your performance
                    </p>
                    <Button onClick={generateSuggestions} disabled={generatingSuggestions}>
                      {generatingSuggestions ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Suggestions
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary */}
                    <p className="text-sm text-muted-foreground">{studyPlan.summary}</p>
                    
                    {/* Priority Focus Areas */}
                    <div className="space-y-2">
                      {studyPlan.priorityAreas.slice(0, 3).map((area, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
                        >
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            area.urgency === "high" ? "bg-red-500" :
                            area.urgency === "medium" ? "bg-yellow-500" : "bg-green-500"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{area.topic}</p>
                            <p className="text-xs text-muted-foreground">{area.reason}</p>
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            <Clock className="w-3 h-3 mr-1" />
                            {area.suggestedTime}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {/* Encouragement */}
                    <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                      <p className="text-sm text-success font-medium">{studyPlan.encouragement}</p>
                    </div>

                    <PrefetchLink to="/study-plan">
                      <Button variant="ghost" size="sm" className="w-full">
                        View Full Study Plan
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </PrefetchLink>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>

          {/* Section 3: Practice & Game Options */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning" />
              Earn Points Now
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Practice Option */}
              <PrefetchLink to="/student/practice-center">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group bg-gradient-to-br from-primary/10 via-primary/5 to-card border border-primary/20 hover:border-primary/40 rounded-2xl p-6 transition-all cursor-pointer h-full"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Practice</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Work through standards-based questions targeting your weak areas
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">+50 XP</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gold/10 px-3 py-1.5 rounded-full">
                      <span className="text-sm">🪙</span>
                      <span className="text-sm font-semibold text-gold">+25</span>
                    </div>
                  </div>
                </motion.div>
              </PrefetchLink>

              {/* Game Practice Option */}
              <PrefetchLink to="/games">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group bg-gradient-to-br from-success/10 via-success/5 to-card border border-success/20 hover:border-success/40 rounded-2xl p-6 transition-all cursor-pointer h-full"
                >
                  <div className="w-14 h-14 rounded-xl bg-success/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Gamepad2 className="w-7 h-7 text-success" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Game Practice</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Play skill games to reinforce learning while having fun
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 bg-success/10 px-3 py-1.5 rounded-full">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="text-sm font-semibold text-success">+30 XP</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gold/10 px-3 py-1.5 rounded-full">
                      <span className="text-sm">🪙</span>
                      <span className="text-sm font-semibold text-gold">+15</span>
                    </div>
                  </div>
                </motion.div>
              </PrefetchLink>
            </div>
          </motion.section>

          {/* Quick Links */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="grid grid-cols-3 gap-3">
              <PrefetchLink to="/regents-prep">
                <QuickLink 
                  icon={<GraduationCap className="w-5 h-5" />}
                  label="Regents Prep"
                  color="primary"
                />
              </PrefetchLink>
              <PrefetchLink to="/student/rewards">
                <QuickLink 
                  icon={<Award className="w-5 h-5" />}
                  label="Rewards"
                  color="gold"
                />
              </PrefetchLink>
              <PrefetchLink to="/student/challenges">
                <QuickLink 
                  icon={<Zap className="w-5 h-5" />}
                  label="Challenges"
                  color="warning"
                />
              </PrefetchLink>
            </div>
          </motion.section>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-inset-bottom z-50">
          <div className="container mx-auto px-2">
            <div className="flex items-center justify-around py-2">
              <NavButton icon={<Home className="w-5 h-5" />} label={t.nav.home} active />
              <PrefetchLink to="/student/rewards">
                <NavButton icon={<Trophy className="w-5 h-5" />} label={t.nav.rewards} />
              </PrefetchLink>
              <PrefetchLink to="/student/challenges">
                <NavButton icon={<Zap className="w-5 h-5" />} label={t.nav.challenges} />
              </PrefetchLink>
              <PrefetchLink to="/student/leaderboard">
                <NavButton icon={<BarChart3 className="w-5 h-5" />} label={t.nav.leaderboard} />
              </PrefetchLink>
            </div>
          </div>
        </nav>

        <PoweredByFooter className="pb-24" />
      </div>
    </>
  );
}

function QuickLink({ icon, label, color }: { icon: React.ReactNode; label: string; color: "primary" | "gold" | "warning" }) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary group-hover:bg-primary/20",
    gold: "bg-gold/10 text-gold group-hover:bg-gold/20",
    warning: "bg-warning/10 text-warning group-hover:bg-warning/20",
  };

  return (
    <div className="group flex flex-col items-center gap-2 p-3 bg-card border border-border hover:border-primary/30 rounded-xl transition-all cursor-pointer">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${colorClasses[color]}`}>
        {icon}
      </div>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </div>
  );
}

function NavButton({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button
      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
        active 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}
