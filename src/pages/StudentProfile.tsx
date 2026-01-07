import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  User, 
  Trophy, 
  Flame, 
  Target, 
  BookOpen, 
  Calculator, 
  Clock, 
  Calendar,
  ChevronLeft,
  Sparkles,
  TrendingUp,
  Award
} from "lucide-react";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { XPBar } from "@/components/XPBar";
import { StreakCounter } from "@/components/StreakCounter";
import { CoinCounter } from "@/components/CoinCounter";
import { BadgeCard } from "@/components/BadgeCard";
import { CollectibleCard } from "@/components/CollectibleCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Demo data
const demoProfile = {
  name: "Alex Johnson",
  avatar: null,
  level: 5,
  xp: 350,
  xpForNextLevel: 500,
  coins: 125,
  streak: 4,
  longestStreak: 12,
  hasShield: true,
  joinedAt: new Date("2025-09-01"),
  gradeLevel: 4,
  totalAssignmentsCompleted: 47,
  totalXpEarned: 2350,
  totalCoinsEarned: 475,
  averageScore: 87,
};

const demoStats = {
  readingLevel: "4th Grade",
  mathLevel: "5th Grade",
  strengths: ["Multiplication", "Reading Comprehension", "Science Facts"],
  areasToImprove: ["Division", "Writing"],
  recentSubjects: [
    { name: "Math", assignments: 15, avgScore: 92 },
    { name: "Reading", assignments: 12, avgScore: 85 },
    { name: "Science", assignments: 10, avgScore: 88 },
    { name: "Writing", assignments: 10, avgScore: 78 },
  ],
};

const demoBadges = [
  { id: "1", name: "First Steps", description: "Complete your first assignment", iconUrl: null, earned: true, earnedAt: "2025-09-02" },
  { id: "2", name: "Streak Starter", description: "Achieve a 3-day streak", iconUrl: null, earned: true, earnedAt: "2025-09-05" },
  { id: "3", name: "Math Wizard", description: "Score 100% on 5 math assignments", iconUrl: null, earned: true, earnedAt: "2025-10-15" },
  { id: "4", name: "Bookworm", description: "Complete 10 reading assignments", iconUrl: null, earned: true, earnedAt: "2025-11-01" },
  { id: "5", name: "Perfect Week", description: "Complete all assignments for a week", iconUrl: null, earned: false },
  { id: "6", name: "Science Explorer", description: "Complete 15 science assignments", iconUrl: null, earned: false },
];

const demoCollectibles = [
  { id: "1", name: "Golden Pencil", description: "A shiny golden pencil for top scholars", imageUrl: null, rarity: "legendary" as const, earned: true },
  { id: "2", name: "Magic Book", description: "An enchanted book of knowledge", imageUrl: null, rarity: "epic" as const, earned: true },
  { id: "3", name: "Star Badge", description: "A bright star for achievers", imageUrl: null, rarity: "rare" as const, earned: true },
  { id: "4", name: "Scholar Hat", description: "The hat of wisdom", imageUrl: null, rarity: "common" as const, earned: true },
  { id: "5", name: "Rainbow Quill", description: "Writes in all colors", imageUrl: null, rarity: "epic" as const, earned: false },
  { id: "6", name: "Time Crystal", description: "Frozen moment of genius", imageUrl: null, rarity: "legendary" as const, earned: false },
];

export default function StudentProfile() {
  const [profile] = useState(demoProfile);
  const [stats] = useState(demoStats);
  const [badges] = useState(demoBadges);
  const [collectibles] = useState(demoCollectibles);

  const earnedBadges = badges.filter(b => b.earned);
  const earnedCollectibles = collectibles.filter(c => c.earned);
  const daysSinceJoin = Math.floor((Date.now() - profile.joinedAt.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/student">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg">My Profile</h1>
          </div>
        </div>

        {/* Profile Card */}
        <div className="container mx-auto px-4 pb-8 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card text-card-foreground rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-hero flex items-center justify-center shadow-glow-primary">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-primary-foreground" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
                <p className="text-muted-foreground">Grade {profile.gradeLevel} Scholar</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Joined {daysSinceJoin} days ago</span>
                </div>
              </div>
            </div>

            <XPBar
              currentXP={profile.xp}
              xpForNextLevel={profile.xpForNextLevel}
              level={profile.level}
            />

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-muted rounded-xl p-3 text-center">
                <CoinCounter coins={profile.coins} size="sm" />
                <p className="text-xs text-muted-foreground mt-1">Total Coins</p>
              </div>
              <div className="flex justify-center">
                <div className="text-center">
                  <StreakCounter streak={profile.streak} hasShield={profile.hasShield} size="sm" />
                  <p className="text-xs text-muted-foreground mt-1">Current Streak</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="container mx-auto px-4 -mt-4 space-y-6">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <StatCard
            icon={<Target className="w-5 h-5 text-primary" />}
            value={profile.totalAssignmentsCompleted}
            label="Missions Complete"
          />
          <StatCard
            icon={<Sparkles className="w-5 h-5 text-gold" />}
            value={profile.totalXpEarned.toLocaleString()}
            label="Total XP Earned"
          />
          <StatCard
            icon={<Flame className="w-5 h-5 text-streak" />}
            value={profile.longestStreak}
            label="Longest Streak"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-success" />}
            value={`${profile.averageScore}%`}
            label="Average Score"
          />
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="achievements" className="flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="collectibles" className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Collectibles</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Learning</span>
            </TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-foreground">Badges Earned</h3>
                <span className="text-sm text-muted-foreground">
                  {earnedBadges.length} / {badges.length}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {badges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <BadgeCard
                      name={badge.name}
                      description={badge.description}
                      iconUrl={badge.iconUrl}
                      earned={badge.earned}
                      earnedAt={badge.earnedAt}
                      size="md"
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Collectibles Tab */}
          <TabsContent value="collectibles">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-foreground">My Collection</h3>
                <span className="text-sm text-muted-foreground">
                  {earnedCollectibles.length} / {collectibles.length}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {collectibles.map((collectible, index) => (
                  <motion.div
                    key={collectible.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <CollectibleCard
                      name={collectible.name}
                      description={collectible.description}
                      imageUrl={collectible.imageUrl}
                      rarity={collectible.rarity}
                      earned={collectible.earned}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Learning Stats Tab */}
          <TabsContent value="stats">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Skill Levels */}
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="font-bold text-lg text-foreground mb-4">Skill Levels</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                    <BookOpen className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">Reading</p>
                      <p className="text-sm text-muted-foreground">{stats.readingLevel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                    <Calculator className="w-8 h-8 text-secondary" />
                    <div>
                      <p className="font-semibold text-foreground">Math</p>
                      <p className="text-sm text-muted-foreground">{stats.mathLevel}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths */}
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-gold" />
                  Strengths
                </h3>
                <div className="flex flex-wrap gap-2">
                  {stats.strengths.map((strength, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-success/10 text-success rounded-full text-sm font-medium"
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </div>

              {/* Areas to Improve */}
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-secondary" />
                  Keep Practicing
                </h3>
                <div className="flex flex-wrap gap-2">
                  {stats.areasToImprove.map((area, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-secondary/10 text-secondary rounded-full text-sm font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Subject Performance */}
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="font-bold text-lg text-foreground mb-4">Subject Performance</h3>
                <div className="space-y-4">
                  {stats.recentSubjects.map((subject, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground">{subject.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {subject.assignments} assignments · {subject.avgScore}% avg
                        </span>
                      </div>
                      <Progress value={subject.avgScore} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Scholar Buddy Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground"
        >
          <div className="flex items-start gap-4">
            <ScholarBuddy size="sm" animate={false} />
            <div>
              <h3 className="font-bold text-lg mb-1">Keep Going, {profile.name.split(' ')[0]}!</h3>
              <p className="opacity-90">
                You're making great progress! Complete {500 - profile.xp} more XP to reach Level {profile.level + 1}! 🌟
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="bg-card rounded-xl p-4 border border-border text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}