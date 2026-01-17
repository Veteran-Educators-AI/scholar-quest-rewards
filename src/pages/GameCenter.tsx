import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Gamepad2, 
  ArrowLeft, 
  Zap, 
  Clock, 
  Brain, 
  Puzzle, 
  Flame,
  Trophy,
  Target,
  Loader2,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface SkillGame {
  id: string;
  game_type: "flashcard_battle" | "timed_challenge" | "matching_puzzle";
  skill_tag: string;
  title: string;
  difficulty: number;
  status: "available" | "in_progress" | "completed";
  high_score: number | null;
  best_time_seconds: number | null;
  attempts_count: number;
  xp_reward: number;
  coin_reward: number;
  created_at: string;
}

const gameTypeConfig = {
  flashcard_battle: {
    icon: Brain,
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    label: "Flashcard Battle",
    description: "Test your memory with flashcards",
  },
  timed_challenge: {
    icon: Clock,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    label: "Timed Challenge",
    description: "Race against the clock",
  },
  matching_puzzle: {
    icon: Puzzle,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    label: "Matching Puzzle",
    description: "Match terms and definitions",
  },
};

export default function GameCenter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<SkillGame[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("available");

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate("/auth");
        return;
      }

      // Fetch games
      const { data: gamesData, error: gamesError } = await supabase
        .from("skill_games")
        .select("*")
        .eq("student_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (gamesError) throw gamesError;

      // Fetch student weaknesses
      const { data: profileData } = await supabase
        .from("student_profiles")
        .select("weaknesses")
        .eq("user_id", userData.user.id)
        .single();

      setGames((gamesData as SkillGame[]) || []);
      setWeaknesses(profileData?.weaknesses || []);
    } catch (error) {
      console.error("Error fetching games:", error);
      toast.error("Failed to load games");
    } finally {
      setLoading(false);
    }
  };

  const availableGames = games.filter((g) => g.status === "available");
  const completedGames = games.filter((g) => g.status === "completed");

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return { label: "Easy", color: "bg-green-500" };
    if (difficulty <= 3) return { label: "Medium", color: "bg-yellow-500" };
    return { label: "Hard", color: "bg-red-500" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/student")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Game Center</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Skill Focus Banner */}
        {weaknesses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Focus Areas from NYClogic Ai</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {weaknesses.slice(0, 4).map((weakness) => (
                        <Badge key={weakness} variant="secondary" className="text-xs">
                          {weakness}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{games.length}</div>
              <div className="text-xs text-muted-foreground">Total Games</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{completedGames.length}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-500 flex items-center justify-center gap-1">
                <Flame className="w-5 h-5" />
                {games.reduce((max, g) => Math.max(max, g.high_score || 0), 0)}
              </div>
              <div className="text-xs text-muted-foreground">Best Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Games Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="available" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Available ({availableGames.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Completed ({completedGames.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            {availableGames.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Gamepad2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Games Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete assignments in NYClogic Ai to unlock skill-based mini-games!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {availableGames.map((game, index) => {
                  const config = gameTypeConfig[game.game_type];
                  const diffInfo = getDifficultyLabel(game.difficulty);
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center shrink-0`}>
                              <Icon className={`w-6 h-6 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-semibold">{game.title}</h3>
                                  <p className="text-sm text-muted-foreground">{config.label}</p>
                                </div>
                                <Badge className={diffInfo.color}>
                                  {diffInfo.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <Badge variant="outline">{game.skill_tag}</Badge>
                                <span className="flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-primary" />
                                  {game.xp_reward} XP
                                </span>
                                <span>🪙 {game.coin_reward}</span>
                              </div>
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-muted-foreground">
                                  {game.attempts_count > 0 
                                    ? `Played ${game.attempts_count} time${game.attempts_count > 1 ? "s" : ""}`
                                    : "New!"}
                                </span>
                                <Button 
                                  size="sm" 
                                  onClick={() => navigate(`/games/${game.id}`)}
                                >
                                  Play Now
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedGames.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Completed Games</h3>
                  <p className="text-sm text-muted-foreground">
                    Play some games to see your achievements here!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {completedGames.map((game, index) => {
                  const config = gameTypeConfig[game.game_type];
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center shrink-0`}>
                              <Icon className={`w-6 h-6 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold">{game.title}</h3>
                              <Badge variant="outline" className="mt-1">{game.skill_tag}</Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">
                                {game.high_score}%
                              </div>
                              <div className="text-xs text-muted-foreground">High Score</div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/games/${game.id}`)}
                            >
                              Replay
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
