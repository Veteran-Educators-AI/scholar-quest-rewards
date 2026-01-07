import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Calendar, 
  Star, 
  Coins, 
  Zap, 
  Clock, 
  CheckCircle2,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, differenceInDays, differenceInHours } from "date-fns";

interface Challenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  start_date: string;
  end_date: string;
  xp_bonus: number;
  coin_bonus: number;
  min_assignments: number;
  badge_id: string | null;
  badge?: {
    name: string;
    icon_url: string;
  };
}

interface Participation {
  challenge_id: string;
  assignments_completed: number;
  completed_at: string | null;
  rewards_claimed: boolean;
}

const themeColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  math: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", icon: "🧮" },
  reading: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", icon: "📚" },
  science: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", icon: "🔬" },
  writing: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", icon: "✏️" },
  default: { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary", icon: "⭐" },
};

export default function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch active challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from("challenges")
        .select(`
          *,
          badge:badges(name, icon_url)
        `)
        .eq("is_active", true)
        .gte("end_date", new Date().toISOString())
        .order("start_date", { ascending: true });

      if (challengesError) throw challengesError;
      setChallenges(challengesData || []);

      // Fetch user's participations
      const { data: participationsData, error: participationsError } = await supabase
        .from("challenge_participants")
        .select("*")
        .eq("student_id", user.id);

      if (participationsError) throw participationsError;
      setParticipations(participationsData || []);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    setJoiningId(challengeId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("challenge_participants")
        .insert({
          challenge_id: challengeId,
          student_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Challenge Joined! 🎯",
        description: "Good luck on your challenge!",
      });

      fetchChallenges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setJoiningId(null);
    }
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const days = differenceInDays(end, now);
    const hours = differenceInHours(end, now) % 24;

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return "Ending soon!";
  };

  const getParticipation = (challengeId: string) => {
    return participations.find(p => p.challenge_id === challengeId);
  };

  const getThemeStyle = (theme: string) => {
    return themeColors[theme] || themeColors.default;
  };

  const isChallengeLive = (challenge: Challenge) => {
    const now = new Date();
    return new Date(challenge.start_date) <= now && new Date(challenge.end_date) >= now;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-lg border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/student" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Weekly Challenges</h1>
              <p className="text-sm text-muted-foreground">Earn bonus rewards!</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Active Challenges */}
        {challenges.filter(c => isChallengeLive(c)).length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold">Live Now</h2>
            </div>
            <div className="grid gap-4">
              {challenges.filter(c => isChallengeLive(c)).map((challenge, index) => {
                const participation = getParticipation(challenge.id);
                const theme = getThemeStyle(challenge.theme);
                const progress = participation 
                  ? (participation.assignments_completed / challenge.min_assignments) * 100 
                  : 0;
                const isCompleted = participation?.completed_at !== null;

                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`${theme.bg} ${theme.border} border-2 overflow-hidden`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{theme.icon}</span>
                            <div>
                              <CardTitle className="text-lg">{challenge.title}</CardTitle>
                              <p className="text-sm text-muted-foreground">{challenge.description}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                            <Clock className="h-3 w-3 mr-1" />
                            {getTimeRemaining(challenge.end_date)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Rewards */}
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20">
                            <Zap className="h-4 w-4 text-blue-400" />
                            <span className="text-sm font-medium">+{challenge.xp_bonus} XP</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20">
                            <Coins className="h-4 w-4 text-amber-400" />
                            <span className="text-sm font-medium">+{challenge.coin_bonus} Coins</span>
                          </div>
                          {challenge.badge && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20">
                              <span>{challenge.badge.icon_url}</span>
                              <span className="text-sm font-medium">{challenge.badge.name}</span>
                            </div>
                          )}
                        </div>

                        {/* Progress or Join */}
                        {participation ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {participation.assignments_completed} / {challenge.min_assignments} assignments
                              </span>
                              {isCompleted && (
                                <span className="flex items-center gap-1 text-green-400">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Completed!
                                </span>
                              )}
                            </div>
                            <Progress value={progress} className="h-3" />
                          </div>
                        ) : (
                          <Button 
                            onClick={() => joinChallenge(challenge.id)}
                            disabled={joiningId === challenge.id}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                          >
                            {joiningId === challenge.id ? "Joining..." : "Join Challenge"}
                            <Star className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Upcoming Challenges */}
        {challenges.filter(c => !isChallengeLive(c)).length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-bold">Coming Soon</h2>
            </div>
            <div className="grid gap-4">
              {challenges.filter(c => !isChallengeLive(c)).map((challenge, index) => {
                const theme = getThemeStyle(challenge.theme);

                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-muted/30 border-dashed opacity-75">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl opacity-50">{theme.icon}</span>
                            <div>
                              <CardTitle className="text-lg">{challenge.title}</CardTitle>
                              <p className="text-sm text-muted-foreground">{challenge.description}</p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            Starts {format(new Date(challenge.start_date), "MMM d")}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span>+{challenge.xp_bonus} XP</span>
                          <span>•</span>
                          <span>+{challenge.coin_bonus} Coins</span>
                          {challenge.badge && (
                            <>
                              <span>•</span>
                              <span>{challenge.badge.icon_url} {challenge.badge.name}</span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty State */}
        {challenges.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Challenges</h3>
            <p className="text-muted-foreground">Check back soon for new challenges!</p>
          </div>
        )}
      </main>
    </div>
  );
}
