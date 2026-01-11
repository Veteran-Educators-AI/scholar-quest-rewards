import { useState, useEffect } from "react";
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
import { Trophy, Gift, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage, interpolate } from "@/i18n/LanguageContext";

// Demo data for first-time experience
const demoStudent = {
  name: "Alex",
  level: 5,
  xp: 350,
  xpForNextLevel: 500,
  coins: 125,
  streak: 4,
  hasShield: true,
};

const demoMissions = [
  {
    id: "1",
    title: "Math Magic: Multiplication",
    subject: "math",
    dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    xpReward: 50,
    coinReward: 10,
    status: "not_started" as const,
  },
  {
    id: "2",
    title: "Reading Adventure: Chapter 5",
    subject: "reading",
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    xpReward: 75,
    coinReward: 15,
    status: "in_progress" as const,
  },
  {
    id: "3",
    title: "Science Explorer: Plants",
    subject: "science",
    dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    xpReward: 60,
    coinReward: 12,
    status: "not_started" as const,
  },
];

const demoBadges = [
  { id: "1", name: "First Steps", earned: true },
  { id: "2", name: "Streak Starter", earned: true },
  { id: "3", name: "Math Whiz", earned: false },
];

export default function StudentHome() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [student] = useState(demoStudent);
  const [missions] = useState(demoMissions);
  const [showTour, setShowTour] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // Check if this is first visit and show guided tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("scholar_tour_completed");
    if (!hasSeenTour) {
      setIsFirstVisit(true);
      setShowTour(true);
    }
  }, []);

  // Show welcome notification for new assignment
  useEffect(() => {
    // Simulate receiving a new assignment notification
    const hasShownAssignmentNotif = sessionStorage.getItem("shown_assignment_notif");
    if (!hasShownAssignmentNotif) {
      setTimeout(() => {
        toast({
          title: "📚 New Assignment!",
          description: "Your teacher just assigned 'Math Magic: Multiplication'. Due in 2 hours!",
        });
        sessionStorage.setItem("shown_assignment_notif", "true");
      }, 2000);
    }
  }, [toast]);

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem("scholar_tour_completed", "true");
    toast({
      title: "🎉 You're all set!",
      description: "Start completing missions to earn XP and coins!",
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

  return (
    <>
      {/* Guided Tour for first-time students */}
      <GuidedTour isOpen={showTour} onComplete={handleTourComplete} />
      
      <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/student/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <ScholarBuddy size="sm" animate={false} />
              <div>
                <h1 className="font-bold text-foreground text-lg">{t.studentHome.title}</h1>
                <p className="text-xs text-muted-foreground">
                  {interpolate(t.studentHome.levelScholar, { level: student.level })}
                </p>
              </div>
            </Link>
            
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <CoinCounter coins={student.coins} size="sm" />
              <NotificationBell />
              <Link to="/student/rewards">
                <Button variant="ghost" size="icon-sm">
                  <Trophy className="w-5 h-5 text-gold" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon-sm" onClick={handleLogout}>
                <LogOut className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Welcome Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/10 via-card to-gold/10 rounded-3xl p-6 md:p-8 border border-border shadow-xl"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0">
              <ScholarBuddy size="lg" message={`${getGreeting()}, ${student.name}! 🌟`} />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">
                {getGreeting()}, <span className="text-gradient-primary">{student.name}!</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-4">{t.greeting.readyForAdventure}</p>
              
              {/* New Assignments Alert */}
              {missions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card border-2 border-primary/30 rounded-2xl p-4 shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-xl">📚</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{missions.length} New Assignments!</h3>
                      <p className="text-sm text-muted-foreground">Your teacher just pushed these for you</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {missions.slice(0, 3).map((mission, idx) => (
                      <motion.div
                        key={mission.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + idx * 0.1 }}
                        className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {mission.subject === "math" ? "🔢" : mission.subject === "reading" ? "📖" : "🔬"}
                          </span>
                          <div>
                            <p className="font-medium text-foreground text-sm">{mission.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Due: {mission.dueAt.toLocaleDateString()} at {mission.dueAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                            +{mission.xpReward} XP
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6">
            <StreakCounter streak={student.streak} hasShield={student.hasShield} />
            <XPBar
              currentXP={student.xp}
              xpForNextLevel={student.xpForNextLevel}
              level={student.level}
              className="bg-card rounded-2xl p-4 shadow-md border border-border flex-1 md:max-w-md"
            />
          </div>
        </motion.section>

        {/* Today's Missions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground">{t.studentHome.todaysMissions}</h3>
            <span className="text-sm text-muted-foreground">{missions.length} {t.common.pending}</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {missions.map((mission, index) => (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                <Link to={`/student/assignment/${mission.id}`}>
                  <MissionCard
                    title={mission.title}
                    subject={mission.subject}
                    dueAt={mission.dueAt}
                    xpReward={mission.xpReward}
                    coinReward={mission.coinReward}
                    status={mission.status}
                  />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Class Schedule */}
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
          transition={{ delay: 0.15 }}
        >
          <StudentRewardPledges />
        </motion.section>

        {/* Recent Badges */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground">{t.studentHome.yourBadges}</h3>
            <Link to="/student/rewards">
              <Button variant="link" className="text-primary">
                {t.common.viewAll}
                <Gift className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {demoBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <BadgeCard
                  name={badge.name}
                  earned={badge.earned}
                  size="sm"
                />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Quick Tips */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground"
        >
          <div className="flex items-start gap-4">
            <ScholarBuddy size="sm" animate={false} />
            <div>
              <h3 className="font-bold text-lg mb-1">{t.studentHome.scholarTip}</h3>
              <p className="opacity-90">{t.studentHome.tipMessage}</p>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-inset-bottom z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <NavButton icon="🏠" label={t.nav.home} active />
            <Link to="/student/rewards">
              <NavButton icon="🏆" label={t.nav.rewards} />
            </Link>
            <Link to="/student/challenges">
              <NavButton icon="⚡" label={t.nav.challenges} />
            </Link>
            <Link to="/student/leaderboard">
              <NavButton icon="📊" label={t.nav.leaderboard} />
            </Link>
          </div>
        </div>
      </nav>
      </div>
    </>
  );
}

function NavButton({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) {
  return (
    <button
      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
