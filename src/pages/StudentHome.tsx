import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { XPBar } from "@/components/XPBar";
import { StreakCounter } from "@/components/StreakCounter";
import { CoinCounter } from "@/components/CoinCounter";
import { MissionCard } from "@/components/MissionCard";
import { BadgeCard } from "@/components/BadgeCard";
import { NotificationBell } from "@/components/NotificationBell";
import { LanguageSelector } from "@/components/LanguageSelector";
import { TranslatedText } from "@/components/TranslatedText";
import { StudentRewardPledges } from "@/components/StudentRewardPledges";
import { GuidedTour } from "@/components/GuidedTour";
import { ClassSchedule } from "@/components/ClassSchedule";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StudyTimer } from "@/components/StudyTimer";
import { Trophy, Gift, LogOut, BookOpen, Target, TrendingUp, Clock, ChevronRight, Home, Award, Zap, BarChart3, Timer, Loader2 } from "lucide-react";
import { PoweredByFooter } from "@/components/PoweredByFooter";
import nycologicLogo from "@/assets/nycologic-ai-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage, interpolate } from "@/i18n/LanguageContext";
import { useStudyTimer, formatStudyTime } from "@/contexts/StudyTimerContext";

interface StudentData {
  name: string;
  level: number;
  xp: number;
  xpForNextLevel: number;
  coins: number;
  streak: number;
  hasShield: boolean;
}

interface Mission {
  id: string;
  title: string;
  subject: string;
  dueAt: Date;
  xpReward: number;
  coinReward: number;
  status: "not_started" | "in_progress" | "submitted" | "verified";
}

interface Badge {
  id: string;
  name: string;
  earned: boolean;
}

export default function StudentHome() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { startTimerForAssignment, getTimeForAssignment } = useStudyTimer();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  // Fetch real user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        // Fetch student profile with XP, coins, streak, and onboarding status
        const { data: studentProfile } = await supabase
          .from("student_profiles")
          .select("xp, coins, current_streak, streak_shield_available, grade_level")
          .eq("user_id", user.id)
          .single();

        // Check if student needs onboarding (grade_level not set)
        if (studentProfile && studentProfile.grade_level === null) {
          navigate("/student/onboarding");
          return;
        }

        // Calculate level from XP (every 500 XP = 1 level)
        const xp = studentProfile?.xp || 0;
        const level = Math.floor(xp / 500) + 1;
        const xpForNextLevel = level * 500;
        const currentLevelXp = xp - ((level - 1) * 500);

        setStudent({
          name: profile?.full_name || user.email?.split("@")[0] || "Scholar",
          level,
          xp: currentLevelXp,
          xpForNextLevel: 500,
          coins: studentProfile?.coins || 0,
          streak: studentProfile?.current_streak || 0,
          hasShield: studentProfile?.streak_shield_available || false,
        });

        // Fetch assignments via enrollments
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("class_id")
          .eq("student_id", user.id);

        if (enrollments && enrollments.length > 0) {
          const classIds = enrollments.map(e => e.class_id);
          const { data: assignments } = await supabase
            .from("assignments")
            .select("id, title, subject, due_at, xp_reward, coin_reward, status")
            .in("class_id", classIds)
            .in("status", ["pending", "active"])
            .order("due_at", { ascending: true })
            .limit(5);

          if (assignments) {
            // Fetch attempts to determine student's status
            const { data: attempts } = await supabase
              .from("attempts")
              .select("assignment_id, status")
              .eq("student_id", user.id)
              .in("assignment_id", assignments.map(a => a.id));

            const attemptMap = new Map(attempts?.map(a => [a.assignment_id, a.status]) || []);

            setMissions(assignments.map(a => ({
              id: a.id,
              title: a.title,
              subject: a.subject || "general",
              dueAt: new Date(a.due_at),
              xpReward: a.xp_reward,
              coinReward: a.coin_reward,
              status: (attemptMap.get(a.id) as Mission["status"]) || "not_started",
            })));
          }
        }

        // Fetch earned badges
        const { data: earnedBadges } = await supabase
          .from("student_badges")
          .select("badge_id, badges(id, name)")
          .eq("student_id", user.id);

        const { data: allBadges } = await supabase
          .from("badges")
          .select("id, name")
          .limit(6);

        if (allBadges) {
          const earnedIds = new Set(earnedBadges?.map(eb => eb.badge_id) || []);
          setBadges(allBadges.map(b => ({
            id: b.id,
            name: b.name,
            earned: earnedIds.has(b.id),
          })));
        }

      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Check if this is first visit and show guided tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("scholar_tour_completed");
    if (!hasSeenTour) {
      setIsFirstVisit(true);
      setShowTour(true);
    }
  }, []);

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem("scholar_tour_completed", "true");
    toast({
      title: "Welcome aboard!",
      description: "Complete assignments to earn XP and level up.",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Default values for new users
  const displayStudent = student || {
    name: "Scholar",
    level: 1,
    xp: 0,
    xpForNextLevel: 500,
    coins: 0,
    streak: 0,
    hasShield: false,
  };

  return (
    <>
      {/* Guided Tour for first-time students */}
      <GuidedTour isOpen={showTour} onComplete={handleTourComplete} />
      
      <div className="min-h-screen bg-background pb-20">
      {/* Modern Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/student/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img 
                src={nycologicLogo} 
                alt="NYCologic Scholar" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-foreground">NYCologic</span>
                  <span className="text-lg font-black text-destructive" style={{ fontFamily: 'Impact, Haettenschweiler, Arial Narrow Bold, sans-serif' }}>SCHOLAR</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Level {displayStudent.level} • {displayStudent.xp}/{displayStudent.xpForNextLevel} XP
                </p>
              </div>
            </Link>
            
            <div className="flex items-center gap-1">
              <StudyTimer />
              <ThemeToggle />
              <LanguageSelector />
              <CoinCounter coins={displayStudent.coins} size="sm" />
              <NotificationBell />
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLogout}>
                <LogOut className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section - Clean & Modern */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden"
        >
          <div className="bg-gradient-to-br from-secondary via-secondary/95 to-secondary/90 rounded-2xl p-6 md:p-8 text-secondary-foreground">
            <div className="relative z-10">
              <p className="text-secondary-foreground/70 text-sm font-medium mb-1">{getGreeting()}</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Welcome back, {displayStudent.name}
              </h2>
              
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-secondary-foreground/10 backdrop-blur rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-xs text-secondary-foreground/70">Level</span>
                  </div>
                  <p className="text-xl font-bold">{displayStudent.level}</p>
                </div>
                <div className="bg-secondary-foreground/10 backdrop-blur rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-gold" />
                    <span className="text-xs text-secondary-foreground/70">Streak</span>
                  </div>
                  <p className="text-xl font-bold">{displayStudent.streak} days</p>
                </div>
                <div className="bg-secondary-foreground/10 backdrop-blur rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-accent" />
                    <span className="text-xs text-secondary-foreground/70">Due Today</span>
                  </div>
                  <p className="text-xl font-bold">{missions.filter(m => m.dueAt < new Date(Date.now() + 24 * 60 * 60 * 1000)).length}</p>
                </div>
              </div>

              {/* XP Progress */}
              <div className="bg-secondary-foreground/10 backdrop-blur rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress to Level {displayStudent.level + 1}</span>
                  <span className="text-sm text-secondary-foreground/70">{displayStudent.xp}/{displayStudent.xpForNextLevel} XP</span>
                </div>
                <div className="h-2 bg-secondary-foreground/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(displayStudent.xp / displayStudent.xpForNextLevel) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  />
                </div>
              </div>
            </div>
            
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 right-4 w-32 h-32 border border-secondary-foreground rounded-full" />
              <div className="absolute bottom-4 left-4 w-24 h-24 border border-secondary-foreground rounded-full" />
            </div>
          </div>
        </motion.section>

        {/* New Assignments Alert */}
        {missions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <h3 className="font-semibold text-foreground">New Assignments</h3>
              </div>
              <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
                {missions.length} pending
              </span>
            </div>
            
            <div className="space-y-3">
              {missions.map((mission, idx) => (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + idx * 0.05 }}
                >
                  <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between">
                      <Link to={`/student/assignment/${mission.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          mission.subject === "math" ? "bg-primary/10 text-primary" :
                          mission.subject === "english" ? "bg-accent/10 text-accent" :
                          "bg-success/10 text-success"
                        }`}>
                          {mission.subject === "math" ? <Target className="w-5 h-5" /> :
                           mission.subject === "english" ? <BookOpen className="w-5 h-5" /> :
                           <Zap className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {mission.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Due {mission.dueAt.toLocaleDateString()} at {mission.dueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {mission.status === "in_progress" && (
                              <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                                In Progress
                              </span>
                            )}
                            {getTimeForAssignment(mission.id) > 0 && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                {formatStudyTime(getTimeForAssignment(mission.id))}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            startTimerForAssignment({
                              id: mission.id,
                              title: mission.title,
                              subject: mission.subject,
                            });
                          }}
                        >
                          <Timer className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium text-primary hidden sm:inline">+{mission.xpReward} XP</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Class Schedule */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ClassSchedule />
        </motion.section>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <ClassSchedule />
        </motion.section>

        {/* Student Reward Pledges */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <StudentRewardPledges />
        </motion.section>

        {/* Recent Achievements */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Achievements</h3>
            <Link to="/student/rewards">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {badges.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {badges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                  className={`flex-shrink-0 bg-card border rounded-xl p-4 min-w-[140px] ${
                    badge.earned ? "border-gold/50" : "border-border opacity-60"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full mb-2 flex items-center justify-center ${
                    badge.earned ? "bg-gold/10 text-gold" : "bg-muted text-muted-foreground"
                  }`}>
                    <Award className="w-5 h-5" />
                  </div>
                  <p className="font-medium text-sm text-foreground">{badge.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {badge.earned ? "Earned" : "Locked"}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <Award className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Complete assignments to earn badges!</p>
            </div>
          )}
        </motion.section>
      </main>

      {/* Bottom Navigation - Modern */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border safe-area-inset-bottom z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <NavButton icon={<Home className="w-5 h-5" />} label={t.nav.home} active />
            <Link to="/student/rewards">
              <NavButton icon={<Trophy className="w-5 h-5" />} label={t.nav.rewards} />
            </Link>
            <Link to="/student/challenges">
              <NavButton icon={<Zap className="w-5 h-5" />} label={t.nav.challenges} />
            </Link>
            <Link to="/student/leaderboard">
              <NavButton icon={<BarChart3 className="w-5 h-5" />} label={t.nav.leaderboard} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Powered by Footer */}
      <PoweredByFooter className="pb-24" />
      </div>
    </>
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
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
