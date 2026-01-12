import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { Confetti } from "@/components/Confetti";
import { Star, Coins, Trophy, Gift, Ticket, Home } from "lucide-react";

interface RewardState {
  xp: number;
  coins: number;
  percentage: number;
  badgeEarned?: string;
  lottoEntry?: boolean;
}

export default function RewardsEarned() {
  const location = useLocation();
  const [showConfetti, setShowConfetti] = useState(true);
  const [animationStep, setAnimationStep] = useState(0);

  const rewards: RewardState = location.state || {
    xp: 50,
    coins: 10,
    percentage: 80,
  };

  useEffect(() => {
    const timers = [
      setTimeout(() => setAnimationStep(1), 500),
      setTimeout(() => setAnimationStep(2), 1000),
      setTimeout(() => setAnimationStep(3), 1500),
      setTimeout(() => setAnimationStep(4), 2000),
    ];
    
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Confetti active={showConfetti} />
      
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center w-full"
        >
          <ScholarBuddy size="lg" message="You did it! Here are your rewards! 🎉" />

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-extrabold mt-6 text-foreground"
          >
            Mission Complete!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground mt-2"
          >
            Score: {rewards.percentage}%
          </motion.p>

          {/* Rewards Animation */}
          <div className="mt-8 space-y-4">
            {/* XP Reward */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={animationStep >= 1 ? { opacity: 1, x: 0 } : {}}
              transition={{ type: "spring", stiffness: 200 }}
              className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-4 flex items-center gap-4"
            >
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Star className="w-8 h-8 text-white" />
              </div>
              <div className="text-left text-white">
                <p className="text-sm opacity-80">Experience Points</p>
                <p className="text-2xl font-extrabold">+{rewards.xp} XP</p>
              </div>
            </motion.div>

            {/* Coins Reward */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={animationStep >= 2 ? { opacity: 1, x: 0 } : {}}
              transition={{ type: "spring", stiffness: 200 }}
              className="bg-gradient-gold rounded-2xl p-4 flex items-center gap-4"
            >
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">
                🪙
              </div>
              <div className="text-left text-gold-foreground">
                <p className="text-sm opacity-80">Scholar Coins</p>
                <p className="text-2xl font-extrabold">+{rewards.coins}</p>
              </div>
            </motion.div>

            {/* Badge Earned (if applicable) */}
            {rewards.badgeEarned && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={animationStep >= 3 ? { opacity: 1, scale: 1 } : {}}
                transition={{ type: "spring", stiffness: 200 }}
                className="bg-gradient-to-r from-accent to-accent/80 rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div className="text-left text-white">
                  <p className="text-sm opacity-80">New Badge!</p>
                  <p className="text-lg font-extrabold">{rewards.badgeEarned}</p>
                </div>
              </motion.div>
            )}

            {/* Lotto Entry (if applicable) */}
            {rewards.lottoEntry && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={animationStep >= 4 ? { opacity: 1, y: 0 } : {}}
                transition={{ type: "spring", stiffness: 200 }}
                className="bg-gradient-to-r from-success to-success/80 rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Ticket className="w-8 h-8 text-white" />
                </div>
                <div className="text-left text-white">
                  <p className="text-sm opacity-80">Lotto Entry!</p>
                  <p className="text-lg font-extrabold">You're in the draw!</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Points Visibility Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={animationStep >= 4 ? { opacity: 1 } : {}}
            className="mt-6 bg-muted rounded-xl p-4 text-sm text-muted-foreground"
          >
            <p>✅ Your teacher and parents can see your progress!</p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={animationStep >= 4 ? { opacity: 1 } : {}}
            className="mt-8 space-y-3"
          >
            <Link to="/student" className="block">
              <Button variant="hero" size="xl" className="w-full">
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </Button>
            </Link>
            
            <Link to="/student/rewards" className="block">
              <Button variant="outline" size="lg" className="w-full">
                <Gift className="w-4 h-4 mr-2" />
                Visit Reward Store
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
