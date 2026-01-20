/**
 * Leaderboard Page
 *
 * Displays student rankings by XP or streak.
 * Refactored to use common design tokens for rank colors.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Trophy,
  Flame,
  Star,
  Crown,
  Medal,
  Award,
  TrendingUp,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getRankColors } from "@/components/common/tokens/colors";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  avatar_initial: string;
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  isCurrentUser?: boolean;
}

interface ClassOption {
  id: string;
  name: string;
}

// Demo data
const demoLeaderboard: LeaderboardEntry[] = [
  { rank: 1, user_id: "1", name: "Emma S.", avatar_initial: "E", xp: 2450, level: 5, current_streak: 14, longest_streak: 21 },
  { rank: 2, user_id: "2", name: "Liam J.", avatar_initial: "L", xp: 2280, level: 5, current_streak: 12, longest_streak: 15 },
  { rank: 3, user_id: "3", name: "Olivia M.", avatar_initial: "O", xp: 2150, level: 4, current_streak: 8, longest_streak: 12 },
  { rank: 4, user_id: "4", name: "Noah K.", avatar_initial: "N", xp: 1980, level: 4, current_streak: 7, longest_streak: 10, isCurrentUser: true },
  { rank: 5, user_id: "5", name: "Ava P.", avatar_initial: "A", xp: 1820, level: 4, current_streak: 5, longest_streak: 8 },
  { rank: 6, user_id: "6", name: "Mason R.", avatar_initial: "M", xp: 1650, level: 4, current_streak: 4, longest_streak: 7 },
  { rank: 7, user_id: "7", name: "Sophia L.", avatar_initial: "S", xp: 1520, level: 3, current_streak: 3, longest_streak: 6 },
  { rank: 8, user_id: "8", name: "Lucas T.", avatar_initial: "L", xp: 1380, level: 3, current_streak: 2, longest_streak: 5 },
  { rank: 9, user_id: "9", name: "Isabella W.", avatar_initial: "I", xp: 1250, level: 3, current_streak: 1, longest_streak: 4 },
  { rank: 10, user_id: "10", name: "Ethan B.", avatar_initial: "E", xp: 1100, level: 2, current_streak: 0, longest_streak: 3 },
];

const demoClasses: ClassOption[] = [
  { id: "all", name: "All Classes" },
  { id: "1", name: "Math 101" },
  { id: "2", name: "Reading 201" },
];

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(demoLeaderboard);
  const [classes, setClasses] = useState<ClassOption[]>(demoClasses);
  const [selectedClass, setSelectedClass] = useState("all");
  const [sortBy, setSortBy] = useState<"xp" | "streak">("xp");
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedClass, sortBy]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchClasses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id, classes(id, name)')
        .eq('student_id', user.id);

      if (enrollments && enrollments.length > 0) {
        const classOptions: ClassOption[] = [
          { id: "all", name: "All Classes" },
          ...enrollments.map(e => ({
            id: (e.classes as any).id,
            name: (e.classes as any).name,
          }))
        ];
        setClasses(classOptions);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Use demo data if not logged in
        updateDemoLeaderboard();
        return;
      }

      // Get student IDs from enrollments
      let studentIds: string[] = [];
      
      if (selectedClass === "all") {
        // Get all classmates from all enrolled classes
        const { data: myEnrollments } = await supabase
          .from('enrollments')
          .select('class_id')
          .eq('student_id', user.id);

        if (myEnrollments && myEnrollments.length > 0) {
          const classIds = myEnrollments.map(e => e.class_id);
          const { data: allEnrollments } = await supabase
            .from('enrollments')
            .select('student_id')
            .in('class_id', classIds);

          studentIds = [...new Set(allEnrollments?.map(e => e.student_id) || [])];
        }
      } else {
        // Get students from specific class
        const { data: classEnrollments } = await supabase
          .from('enrollments')
          .select('student_id')
          .eq('class_id', selectedClass);

        studentIds = classEnrollments?.map(e => e.student_id) || [];
      }

      if (studentIds.length === 0) {
        updateDemoLeaderboard();
        return;
      }

      // Fetch student profiles
      const { data: profiles } = await supabase
        .from('student_profiles')
        .select('user_id, xp, current_streak, longest_streak')
        .in('user_id', studentIds);

      // Fetch names
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);

      if (profiles && userProfiles) {
        const entries: LeaderboardEntry[] = profiles.map(sp => {
          const profile = userProfiles.find(p => p.id === sp.user_id);
          return {
            rank: 0,
            user_id: sp.user_id,
            name: profile?.full_name || 'Student',
            avatar_initial: (profile?.full_name || 'S').charAt(0).toUpperCase(),
            xp: sp.xp,
            level: Math.floor(sp.xp / 500) + 1,
            current_streak: sp.current_streak,
            longest_streak: sp.longest_streak,
            isCurrentUser: sp.user_id === user.id,
          };
        });

        // Sort and assign ranks
        const sorted = sortBy === "xp" 
          ? entries.sort((a, b) => b.xp - a.xp)
          : entries.sort((a, b) => b.current_streak - a.current_streak);

        sorted.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        setLeaderboard(sorted);
      } else {
        updateDemoLeaderboard();
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      updateDemoLeaderboard();
    } finally {
      setLoading(false);
    }
  };

  const updateDemoLeaderboard = () => {
    const sorted = sortBy === "xp"
      ? [...demoLeaderboard].sort((a, b) => b.xp - a.xp)
      : [...demoLeaderboard].sort((a, b) => b.current_streak - a.current_streak);
    
    sorted.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    setLeaderboard(sorted);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-gold fill-gold/30" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number, isCurrentUser: boolean) => {
    const colors = getRankColors(rank, isCurrentUser);
    return cn(colors.bg, colors.border);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/student">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-gold" />
              <div>
                <h1 className="font-bold text-foreground text-xl">Leaderboard</h1>
                <p className="text-sm text-muted-foreground">See how you rank!</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as "xp" | "streak")} className="flex-1">
            <TabsList className="grid w-full grid-cols-2 sm:w-64">
              <TabsTrigger value="xp" className="gap-2">
                <Star className="w-4 h-4" />
                By XP
              </TabsTrigger>
              <TabsTrigger value="streak" className="gap-2">
                <Flame className="w-4 h-4" />
                By Streak
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Top 3 Podium */}
        {!loading && leaderboard.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-end justify-center gap-4 py-6"
          >
            {/* 2nd Place */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-2xl font-bold text-white shadow-lg mb-2">
                {leaderboard[1]?.avatar_initial}
              </div>
              <Medal className="w-6 h-6 text-gray-400 -mt-4 mb-1" />
              <p className="font-bold text-foreground text-sm">{leaderboard[1]?.name}</p>
              <p className="text-xs text-muted-foreground">
                {sortBy === "xp" ? `${leaderboard[1]?.xp} XP` : `${leaderboard[1]?.current_streak} days`}
              </p>
              <div className="w-20 h-16 bg-gray-200 rounded-t-lg mt-2" />
            </motion.div>

            {/* 1st Place */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown className="w-8 h-8 text-gold fill-gold/30 mb-1" />
              </motion.div>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl mb-2">
                {leaderboard[0]?.avatar_initial}
              </div>
              <p className="font-bold text-foreground">{leaderboard[0]?.name}</p>
              <p className="text-sm text-muted-foreground">
                {sortBy === "xp" ? `${leaderboard[0]?.xp} XP` : `${leaderboard[0]?.current_streak} days`}
              </p>
              <div className="w-24 h-24 bg-gold/20 rounded-t-lg mt-2" />
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col items-center"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-xl font-bold text-white shadow-lg mb-2">
                {leaderboard[2]?.avatar_initial}
              </div>
              <Award className="w-5 h-5 text-amber-600 -mt-3 mb-1" />
              <p className="font-bold text-foreground text-sm">{leaderboard[2]?.name}</p>
              <p className="text-xs text-muted-foreground">
                {sortBy === "xp" ? `${leaderboard[2]?.xp} XP` : `${leaderboard[2]?.current_streak} days`}
              </p>
              <div className="w-16 h-12 bg-amber-100 rounded-t-lg mt-2" />
            </motion.div>
          </motion.div>
        )}

        {/* Full Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            leaderboard.map((entry, index) => (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.03 }}
                className={cn(
                  "rounded-xl p-4 border transition-all hover:scale-[1.01]",
                  getRankStyle(entry.rank, entry.isCurrentUser || false)
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="w-8 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${
                    entry.rank === 1 ? "bg-gradient-to-br from-gold to-amber-500" :
                    entry.rank === 2 ? "bg-gradient-to-br from-gray-300 to-gray-400" :
                    entry.rank === 3 ? "bg-gradient-to-br from-amber-500 to-amber-600" :
                    "bg-gradient-primary"
                  }`}>
                    {entry.avatar_initial}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground truncate">
                        {entry.name}
                        {entry.isCurrentUser && (
                          <span className="text-primary ml-1">(You)</span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Level {entry.level}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-right">
                    <div className={sortBy === "xp" ? "font-bold" : ""}>
                      <div className="flex items-center gap-1 justify-end">
                        <Star className={`w-4 h-4 ${sortBy === "xp" ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={sortBy === "xp" ? "text-primary" : "text-muted-foreground"}>
                          {entry.xp.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">XP</p>
                    </div>
                    <div className={sortBy === "streak" ? "font-bold" : ""}>
                      <div className="flex items-center gap-1 justify-end">
                        <Flame className={`w-4 h-4 ${sortBy === "streak" ? "text-streak" : "text-muted-foreground"}`} />
                        <span className={sortBy === "streak" ? "text-streak" : "text-muted-foreground"}>
                          {entry.current_streak}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Streak</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Motivation Message */}
        {!loading && leaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-primary rounded-2xl p-6 text-center text-primary-foreground"
          >
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <h3 className="font-bold text-lg mb-1">Keep Going!</h3>
            <p className="opacity-90 text-sm">
              Complete assignments daily to climb the leaderboard and earn awesome rewards! 🚀
            </p>
          </motion.div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-inset-bottom z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <Link to="/student">
              <NavButton icon="🏠" label="Home" />
            </Link>
            <Link to="/student/rewards">
              <NavButton icon="🏆" label="Rewards" />
            </Link>
            <NavButton icon="📊" label="Leaderboard" active />
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
      className={cn(
        "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
