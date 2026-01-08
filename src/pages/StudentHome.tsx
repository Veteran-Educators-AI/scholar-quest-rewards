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
import { Button } from "@/components/ui/button";
import { Trophy, Gift, LogOut, Sparkles, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage, interpolate } from "@/i18n/LanguageContext";

interface ParentPledge {
  id: string;
  badge_id: string;
  reward_description: string;
  badge_name: string;
  parent_name: string;
}

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
  const [pledges, setPledges] = useState<ParentPledge[]>([]);

  useEffect(() => {
    fetchPledges();
  }, []);

  const fetchPledges = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: pledgesData } = await supabase
      .from('parent_reward_pledges')
      .select('id, badge_id, reward_description, parent_id')
      .eq('student_id', user.id)
      .eq('is_active', true)
      .eq('claimed', false);

    if (pledgesData && pledgesData.length > 0) {
      // Enrich with badge and parent names
      const enrichedPledges = await Promise.all(
        pledgesData.map(async (pledge) => {
          const { data: badge } = await supabase
            .from('badges')
            .select('name')
            .eq('id', pledge.badge_id)
            .single();

          const { data: parent } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', pledge.parent_id)
            .single();

          return {
            id: pledge.id,
            badge_id: pledge.badge_id,
            reward_description: pledge.reward_description,
            badge_name: badge?.name || 'Badge',
            parent_name: parent?.full_name || 'Your parent',
          };
        })
      );
      setPledges(enrichedPledges);
    }
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
              <p className="text-muted-foreground">{t.greeting.readyForAdventure}</p>
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

        {/* Parent Reward Pledges */}
        {pledges.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-gold" />
              <h3 className="text-xl font-bold text-foreground">Rewards Waiting For You!</h3>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {pledges.map((pledge, index) => (
                <motion.div
                  key={pledge.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                  className="bg-gradient-to-br from-gold/10 via-card to-primary/5 rounded-2xl p-4 border border-gold/20 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Gift className="w-6 h-6 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground mb-1">
                        {pledge.parent_name} promised:
                      </p>
                      <p className="font-bold text-foreground text-lg mb-2">
                        {pledge.reward_description}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">
                          Earn the <span className="font-medium text-primary">{pledge.badge_name}</span> badge!
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

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
