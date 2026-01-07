import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { XPBar } from "@/components/XPBar";
import { StreakCounter } from "@/components/StreakCounter";
import { CoinCounter } from "@/components/CoinCounter";
import { MissionCard } from "@/components/MissionCard";
import { BadgeCard } from "@/components/BadgeCard";
import { Button } from "@/components/ui/button";
import { Trophy, Gift, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    xpReward: 50,
    coinReward: 10,
    status: "not_started" as const,
  },
  {
    id: "2",
    title: "Reading Adventure: Chapter 5",
    subject: "reading",
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    xpReward: 75,
    coinReward: 15,
    status: "in_progress" as const,
  },
  {
    id: "3",
    title: "Science Explorer: Plants",
    subject: "science",
    dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days
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
  const [student] = useState(demoStudent);
  const [missions] = useState(demoMissions);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "See you later! 👋",
      description: "Come back soon to continue your learning journey!",
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ScholarBuddy size="sm" animate={false} />
              <div>
                <h1 className="font-bold text-foreground text-lg">Scan Scholar</h1>
                <p className="text-xs text-muted-foreground">Level {student.level} Scholar</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <CoinCounter coins={student.coins} size="sm" />
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
        {/* Greeting & Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
                {getGreeting()}, <span className="text-gradient-primary">{student.name}!</span>
              </h2>
              <p className="text-muted-foreground">Ready for today's adventures?</p>
            </div>
            
            <StreakCounter streak={student.streak} hasShield={student.hasShield} />
          </div>

          <XPBar
            currentXP={student.xp}
            xpForNextLevel={student.xpForNextLevel}
            level={student.level}
            className="bg-card rounded-2xl p-4 shadow-md border border-border"
          />
        </motion.section>

        {/* Today's Missions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground">Today's Missions</h3>
            <span className="text-sm text-muted-foreground">{missions.length} pending</span>
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

        {/* Recent Badges */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground">Your Badges</h3>
            <Link to="/student/rewards">
              <Button variant="link" className="text-primary">
                View all
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
              <h3 className="font-bold text-lg mb-1">Scholar Tip of the Day!</h3>
              <p className="opacity-90">
                Complete your missions on time to keep your streak going! 
                You have a streak shield ready if you need a day off. 🛡️
              </p>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-inset-bottom z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <NavButton icon="🏠" label="Home" active />
            <Link to="/student/rewards">
              <NavButton icon="🏆" label="Rewards" />
            </Link>
            <NavButton icon="📊" label="Progress" />
            <NavButton icon="👤" label="Profile" />
          </div>
        </div>
      </nav>
    </div>
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
