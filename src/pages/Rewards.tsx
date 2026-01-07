import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BadgeCard } from "@/components/BadgeCard";
import { CollectibleCard } from "@/components/CollectibleCard";
import { XPBar } from "@/components/XPBar";
import { CoinCounter } from "@/components/CoinCounter";
import { StreakCounter } from "@/components/StreakCounter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, Sparkles, Star } from "lucide-react";

// Demo data
const demoStudent = {
  level: 5,
  xp: 350,
  xpForNextLevel: 500,
  coins: 125,
  streak: 4,
  longestStreak: 12,
  hasShield: true,
  totalBadges: 8,
  totalCollectibles: 15,
};

const demoBadges = [
  { id: "1", name: "First Steps", description: "Complete your first assignment", earned: true },
  { id: "2", name: "Streak Starter", description: "Get a 3-day streak", earned: true },
  { id: "3", name: "On-Time Hero", description: "Complete 5 assignments on time", earned: true },
  { id: "4", name: "Math Whiz", description: "Score 100% on a math assignment", earned: false },
  { id: "5", name: "Bookworm", description: "Complete 10 reading assignments", earned: false },
  { id: "6", name: "Streak Master", description: "Get a 7-day streak", earned: false },
  { id: "7", name: "Effort Champion", description: "Complete 5 paper assignments", earned: true },
  { id: "8", name: "Rising Star", description: "Reach level 5", earned: true },
];

const demoCollectibles = [
  { id: "1", name: "Wise Owl", rarity: "common" as const, earned: true },
  { id: "2", name: "Golden Book", rarity: "rare" as const, earned: true },
  { id: "3", name: "Magic Wand", rarity: "epic" as const, earned: true },
  { id: "4", name: "Dragon Scholar", rarity: "legendary" as const, earned: false },
  { id: "5", name: "Study Buddy", rarity: "common" as const, earned: true },
  { id: "6", name: "Star Catcher", rarity: "rare" as const, earned: false },
];

export default function Rewards() {
  const [student] = useState(demoStudent);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/student">
              <Button variant="ghost" size="icon-sm" className="text-primary-foreground hover:bg-primary-foreground/20">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-extrabold">My Rewards</h1>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary-foreground/10 backdrop-blur rounded-2xl p-4 text-center"
            >
              <Trophy className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-extrabold">{student.totalBadges}</p>
              <p className="text-xs opacity-80">Badges</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-primary-foreground/10 backdrop-blur rounded-2xl p-4 text-center"
            >
              <Sparkles className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-extrabold">{student.totalCollectibles}</p>
              <p className="text-xs opacity-80">Cards</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-primary-foreground/10 backdrop-blur rounded-2xl p-4 text-center"
            >
              <Star className="w-8 h-8 mx-auto mb-2" />
              <p className="text-2xl font-extrabold">{student.longestStreak}</p>
              <p className="text-xs opacity-80">Best Streak</p>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* XP & Coins */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 shadow-md border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <XPBar
              currentXP={student.xp}
              xpForNextLevel={student.xpForNextLevel}
              level={student.level}
              className="flex-1"
            />
          </div>
          <div className="flex items-center justify-between">
            <CoinCounter coins={student.coins} />
            <StreakCounter streak={student.streak} hasShield={student.hasShield} size="sm" />
          </div>
        </motion.div>

        {/* Tabs for Badges & Collectibles */}
        <Tabs defaultValue="badges" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl">
            <TabsTrigger value="badges" className="rounded-lg font-bold">
              🏅 Badges
            </TabsTrigger>
            <TabsTrigger value="collectibles" className="rounded-lg font-bold">
              🃏 Scholar Cards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="badges" className="mt-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {demoBadges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <BadgeCard
                    name={badge.name}
                    description={badge.description}
                    earned={badge.earned}
                    size="sm"
                  />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="collectibles" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {demoCollectibles.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <CollectibleCard
                    name={card.name}
                    rarity={card.rarity}
                    earned={card.earned}
                  />
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-inset-bottom z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <Link to="/student">
              <NavButton icon="🏠" label="Home" />
            </Link>
            <NavButton icon="🏆" label="Rewards" active />
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
