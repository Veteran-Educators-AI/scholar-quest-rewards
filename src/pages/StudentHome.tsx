import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CoinCounter } from "@/components/CoinCounter";
import { NotificationBell } from "@/components/NotificationBell";
import { LanguageSelector } from "@/components/LanguageSelector";
import { StudentRewardPledges } from "@/components/StudentRewardPledges";
import { GuidedTour } from "@/components/GuidedTour";
import { ClassSchedule } from "@/components/ClassSchedule";
import { StandardsMasteryWidget } from "@/components/StandardsMasteryWidget";
import { DailyQuoteCard } from "@/components/DailyQuoteCard";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StudyTimer } from "@/components/StudyTimer";
import { 
  Trophy, LogOut, BookOpen, Target, TrendingUp, Clock, ChevronRight, 
  Home, Award, Zap, BarChart3, Timer, Loader2, Flame, Shield, 
  GraduationCap, Ticket, Brain
} from "lucide-react";
import { PoweredByFooter } from "@/components/PoweredByFooter";
import highschoolLogo from "@/assets/highschool-logo-new.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
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
  const { t } = useLanguage();
  const { startTimerForAssignment, getTimeForAssignment } = useStudyTimer();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        const { data: studentProfile } = await supabase
          .from("student_profiles")
          .select("xp, coins, current_streak, streak_shield_available, grade_level")
          .eq("user_id", user.id)
          .single();

        if (studentProfile && studentProfile.grade_level === null) {
          navigate("/student/onboarding");
          return;
        }

        const xp = studentProfile?.xp || 0;
        const level = Math.floor(xp / 500) + 1;

        setStudent({
          name: profile?.full_name || user.email?.split("@")[0] || "Scholar",
          level,
          xp: xp - ((level - 1) * 500),
          xpForNextLevel: 500,
          coins: studentProfile?.coins || 0,
          streak: studentProfile?.current_streak || 0,
          hasShield: studentProfile?.streak_shield_available || false,
        });

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
  }, [navigate]);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("scholar_tour_completed");
    if (!hasSeenTour) {
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

  const displayStudent = student || {
    name: "Scholar",
    level: 1,
    xp: 0,
    xpForNextLevel: 500,
    coins: 0,
    streak: 0,
    hasShield: false,
  };

  const progressPercent = (displayStudent.xp / displayStudent.xpForNextLevel) * 100;

  return (
    <>
      <GuidedTour isOpen={showTour} onComplete={handleTourComplete} />
      
      <div className="min-h-screen bg-background pb-24">
        {/* Refined Header */}
        <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link to="/student/profile" className="flex items-center gap-3 group">
                <div className="relative">
                  <img 
                    src={highschoolLogo} 
                    alt="Scholar" 
                    className="w-10 h-10 object-contain"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[8px] font-bold text-primary-foreground border-2 border-card">
                    {displayStudent.level}
                  </div>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {displayStudent.name}
                  </p>
                  <p className="text-xs text-muted-foreground">Level {displayStudent.level}</p>
                </div>
              </Link>
              
              <div className="flex items-center gap-1 sm:gap-2">
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
          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-gradient-to-br from-secondary via-secondary to-secondary/95 rounded-2xl p-6 text-secondary-foreground overflow-hidden relative">
              {/* Subtle geometric accents */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                <p className="text-secondary-foreground/60 text-sm font-medium tracking-wide uppercase mb-1">
                  {getGreeting()}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
                  Welcome back, {displayStudent.name.split(' ')[0]}
                </h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <StatCard 
                    icon={<GraduationCap className="w-4 h-4" />}
                    label="Level"
                    value={displayStudent.level}
                    accent="primary"
                  />
                  <StatCard 
                    icon={<Flame className="w-4 h-4" />}
                    label="Streak"
                    value={`${displayStudent.streak}d`}
                    accent="streak"
                    extra={displayStudent.hasShield && <Shield className="w-3 h-3 text-success ml-1" />}
                  />
                  <StatCard 
                    icon={<Target className="w-4 h-4" />}
                    label="Due Today"
                    value={missions.filter(m => 
                      m.dueAt.toDateString() === new Date().toDateString()
                    ).length}
                    accent="warning"
                  />
                  <StatCard 
                    icon={<TrendingUp className="w-4 h-4" />}
                    label="Completed"
                    value={missions.filter(m => m.status === "verified").length}
                    accent="success"
                  />
                </div>

                {/* XP Progress */}
                <div className="bg-secondary-foreground/5 backdrop-blur-sm rounded-xl p-4 border border-secondary-foreground/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-secondary-foreground/80">
                      Progress to Level {displayStudent.level + 1}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {displayStudent.xp} / {displayStudent.xpForNextLevel} XP
                    </span>
                  </div>
                  <div className="h-2 bg-secondary-foreground/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-primary via-primary to-accent rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Assignments Section */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">Assignments</h2>
                {missions.length > 0 && (
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    {missions.length} pending
                  </span>
                )}
              </div>
              <Link to="/student/assignments">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary h-8">
                  View all
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {missions.length > 0 ? (
              <div className="space-y-2">
                {missions.map((mission, idx) => (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + idx * 0.03 }}
                  >
                    <Link 
                      to={`/student/assignment/${mission.id}`}
                      className="group flex items-center gap-4 bg-card border border-border hover:border-primary/30 rounded-xl p-4 transition-all hover:shadow-sm"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        mission.subject === "math" ? "bg-primary/10 text-primary" :
                        mission.subject === "english" ? "bg-accent/10 text-accent" :
                        "bg-success/10 text-success"
                      }`}>
                        {mission.subject === "math" ? <Target className="w-5 h-5" /> :
                         mission.subject === "english" ? <BookOpen className="w-5 h-5" /> :
                         <Zap className="w-5 h-5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {mission.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {mission.dueAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          {mission.status === "in_progress" && (
                            <span className="text-warning font-medium">In Progress</span>
                          )}
                          {getTimeForAssignment(mission.id) > 0 && (
                            <span className="flex items-center gap-1 text-primary">
                              <Timer className="w-3 h-3" />
                              {formatStudyTime(getTimeForAssignment(mission.id))}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
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
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-semibold text-primary">+{mission.xpReward} XP</p>
                          <p className="text-xs text-gold">+{mission.coinReward} coins</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No pending assignments</p>
                <p className="text-sm text-muted-foreground/70 mt-1">You're all caught up!</p>
              </div>
            )}
          </motion.section>

          {/* Quick Actions */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="grid grid-cols-3 gap-3">
              <Link to="/student/practice-center">
                <QuickActionCard 
                  icon={<Brain className="w-5 h-5" />}
                  title="Practice Center"
                  description="Skill exercises"
                  accent="success"
                />
              </Link>
              <Link to="/student/raffle">
                <QuickActionCard 
                  icon={<Ticket className="w-5 h-5" />}
                  title="Weekly Raffle"
                  description="Enter to win prizes"
                  accent="gold"
                />
              </Link>
              <Link to="/student/challenges">
                <QuickActionCard 
                  icon={<Zap className="w-5 h-5" />}
                  title="Challenges"
                  description="Earn bonus rewards"
                  accent="primary"
                />
              </Link>
            </div>
          </motion.section>

          {/* Daily Inspirational Quote */}
          <DailyQuoteCard />

          {/* Standards Mastery Widget */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <StandardsMasteryWidget />
          </motion.section>

          {/* Schedule Section */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <ClassSchedule />
          </motion.section>

          {/* Reward Pledges */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <StudentRewardPledges />
          </motion.section>

          {/* Achievements */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Achievements</h2>
              <Link to="/student/rewards">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary h-8">
                  View all
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {badges.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {badges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.03 }}
                    className={`flex-shrink-0 bg-card border rounded-xl p-4 min-w-[130px] transition-all ${
                      badge.earned 
                        ? "border-gold/40 hover:border-gold/60" 
                        : "border-border opacity-50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full mb-3 flex items-center justify-center ${
                      badge.earned ? "bg-gold/10 text-gold" : "bg-muted text-muted-foreground"
                    }`}>
                      <Award className="w-5 h-5" />
                    </div>
                    <p className="font-medium text-sm text-foreground leading-tight">{badge.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {badge.earned ? "Earned" : "Locked"}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No achievements yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Complete assignments to earn badges!</p>
              </div>
            )}
          </motion.section>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-inset-bottom z-50">
          <div className="container mx-auto px-2">
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

        <PoweredByFooter className="pb-24" />
      </div>
    </>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  accent, 
  extra 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number;
  accent: "primary" | "streak" | "warning" | "success";
  extra?: React.ReactNode;
}) {
  const accentColors = {
    primary: "text-primary",
    streak: "text-streak",
    warning: "text-warning",
    success: "text-success",
  };

  return (
    <div className="bg-secondary-foreground/5 backdrop-blur-sm rounded-lg p-3 border border-secondary-foreground/10">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={accentColors[accent]}>{icon}</span>
        <span className="text-xs text-secondary-foreground/60 font-medium">{label}</span>
      </div>
      <div className="flex items-center">
        <p className="text-xl font-bold tabular-nums">{value}</p>
        {extra}
      </div>
    </div>
  );
}

function QuickActionCard({ 
  icon, 
  title, 
  description, 
  accent 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  accent: "primary" | "gold" | "success";
}) {
  const accentColors = {
    primary: "bg-primary/10 text-primary group-hover:bg-primary/20",
    gold: "bg-gold/10 text-gold group-hover:bg-gold/20",
    success: "bg-success/10 text-success group-hover:bg-success/20",
  };

  return (
    <div className="group bg-card border border-border hover:border-primary/30 rounded-xl p-4 transition-all hover:shadow-sm cursor-pointer">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${accentColors[accent]}`}>
        {icon}
      </div>
      <p className="font-medium text-foreground group-hover:text-primary transition-colors">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
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
