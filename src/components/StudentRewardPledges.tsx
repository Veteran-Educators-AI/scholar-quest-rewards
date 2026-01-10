import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, Coins, Target, Trophy, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PointPledge {
  id: string;
  coin_threshold: number;
  reward_description: string;
  reward_type: string;
  parent_name: string;
}

interface BadgePledge {
  id: string;
  badge_id: string;
  reward_description: string;
  badge_name: string;
  parent_name: string;
  badge_earned: boolean;
}

interface StudentRewardPledgesProps {
  className?: string;
}

const rewardTypeEmoji: Record<string, string> = {
  toy: "🧸",
  game: "🎮",
  outing: "🎢",
  treat: "🍦",
  screen_time: "📺",
  sleepover: "🏠",
  custom: "🎁",
};

export function StudentRewardPledges({ className }: StudentRewardPledgesProps) {
  const [pointPledges, setPointPledges] = useState<PointPledge[]>([]);
  const [badgePledges, setBadgePledges] = useState<BadgePledge[]>([]);
  const [currentCoins, setCurrentCoins] = useState(0);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPledgesAndProgress();
  }, []);

  const fetchPledgesAndProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch student profile for current coins
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('coins')
      .eq('user_id', user.id)
      .single();

    if (studentProfile) {
      setCurrentCoins(studentProfile.coins);
    }

    // Fetch earned badges
    const { data: earnedBadges } = await supabase
      .from('student_badges')
      .select('badge_id')
      .eq('student_id', user.id);

    const earnedIds = earnedBadges?.map(b => b.badge_id) || [];
    setEarnedBadgeIds(earnedIds);

    // Fetch point-based pledges
    const { data: pointPledgesData } = await supabase
      .from('parent_point_pledges')
      .select('id, coin_threshold, reward_description, reward_type, parent_id')
      .eq('student_id', user.id)
      .eq('is_active', true)
      .eq('claimed', false)
      .order('coin_threshold', { ascending: true });

    if (pointPledgesData && pointPledgesData.length > 0) {
      const enrichedPointPledges = await Promise.all(
        pointPledgesData.map(async (pledge) => {
          const { data: parent } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', pledge.parent_id)
            .single();

          return {
            id: pledge.id,
            coin_threshold: pledge.coin_threshold,
            reward_description: pledge.reward_description,
            reward_type: pledge.reward_type,
            parent_name: parent?.full_name || 'Your parent',
          };
        })
      );
      setPointPledges(enrichedPointPledges);
    }

    // Fetch badge-based pledges
    const { data: badgePledgesData } = await supabase
      .from('parent_reward_pledges')
      .select('id, badge_id, reward_description, parent_id')
      .eq('student_id', user.id)
      .eq('is_active', true)
      .eq('claimed', false);

    if (badgePledgesData && badgePledgesData.length > 0) {
      const enrichedBadgePledges = await Promise.all(
        badgePledgesData.map(async (pledge) => {
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
            badge_earned: earnedIds.includes(pledge.badge_id),
          };
        })
      );
      setBadgePledges(enrichedBadgePledges);
    }

    setLoading(false);
  };

  const getProgressPercentage = (threshold: number) => {
    return Math.min(100, (currentCoins / threshold) * 100);
  };

  const getCoinsNeeded = (threshold: number) => {
    return Math.max(0, threshold - currentCoins);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse flex items-center gap-4">
            <div className="w-12 h-12 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pointPledges.length === 0 && badgePledges.length === 0) {
    return null;
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="bg-gradient-to-r from-gold/10 to-primary/10 border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-gold" />
          Prizes You're Working Toward!
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Complete tasks and earn points to unlock these awesome rewards from your family!
        </p>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Current Coins Display */}
        <div className="flex items-center gap-3 p-3 bg-gold/10 rounded-xl border border-gold/20">
          <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
            <Coins className="w-5 h-5 text-gold" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your Current Coins</p>
            <p className="text-xl font-bold text-foreground">{currentCoins}</p>
          </div>
        </div>

        {/* Point-Based Pledges */}
        {pointPledges.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Coin Goals
            </h4>
            {pointPledges.map((pledge, index) => {
              const progress = getProgressPercentage(pledge.coin_threshold);
              const coinsNeeded = getCoinsNeeded(pledge.coin_threshold);
              const isComplete = currentCoins >= pledge.coin_threshold;

              return (
                <motion.div
                  key={pledge.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-xl border transition-all ${
                    isComplete
                      ? "bg-success/10 border-success/30"
                      : "bg-card border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${
                      isComplete ? "bg-success/20" : "bg-muted"
                    }`}>
                      {rewardTypeEmoji[pledge.reward_type] || "🎁"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-bold text-foreground truncate">
                          {pledge.reward_description}
                        </p>
                        {isComplete && (
                          <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                            Ready! 🎉
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        From {pledge.parent_name}
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {currentCoins} / {pledge.coin_threshold} coins
                          </span>
                          {!isComplete && (
                            <span className="text-primary font-medium">
                              {coinsNeeded} more to go!
                            </span>
                          )}
                        </div>
                        <Progress 
                          value={progress} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Badge-Based Pledges */}
        {badgePledges.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Badge Goals
            </h4>
            {badgePledges.map((pledge, index) => (
              <motion.div
                key={pledge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (pointPledges.length + index) * 0.05 }}
                className={`p-4 rounded-xl border transition-all ${
                  pledge.badge_earned
                    ? "bg-success/10 border-success/30"
                    : "bg-card border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    pledge.badge_earned ? "bg-success/20" : "bg-gold/20"
                  }`}>
                    <Gift className={`w-6 h-6 ${pledge.badge_earned ? "text-success" : "text-gold"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-bold text-foreground truncate">
                        {pledge.reward_description}
                      </p>
                      {pledge.badge_earned && (
                        <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          Ready! 🎉
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      From {pledge.parent_name}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Trophy className="w-3.5 h-3.5 text-primary" />
                      <span className="text-muted-foreground">
                        {pledge.badge_earned ? (
                          <span className="text-success">You earned the badge!</span>
                        ) : (
                          <>Earn the <span className="font-medium text-primary">{pledge.badge_name}</span> badge</>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Motivational Message */}
        <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10 text-center">
          <p className="text-sm text-muted-foreground">
            💪 Keep completing assignments and being a great student to earn more coins!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
