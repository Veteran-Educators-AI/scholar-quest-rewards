import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import FlashcardBattle from "@/components/games/FlashcardBattle";
import TimedChallenge from "@/components/games/TimedChallenge";
import MatchingPuzzle from "@/components/games/MatchingPuzzle";
import { useSecureRewards } from "@/hooks/useSecureRewards";

interface GameData {
  id: string;
  student_id: string;
  game_type: "flashcard_battle" | "timed_challenge" | "matching_puzzle";
  skill_tag: string;
  title: string;
  difficulty: number;
  game_data: {
    cards?: Array<{ id: string; front: string; back: string; hint?: string }>;
    questions?: Array<{ id: string; prompt: string; options: string[]; correctAnswer: string; hint?: string }>;
    pairs?: Array<{ id: string; term: string; definition: string }>;
    timePerQuestion?: number;
  };
  status: string;
  high_score: number | null;
  xp_reward: number;
  coin_reward: number;
}

export default function PlayGame() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<GameData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { awardRewards, checkIfClaimed } = useSecureRewards();

  useEffect(() => {
    fetchGame();
  }, [id]);

  const fetchGame = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate("/auth");
        return;
      }
      setUserId(userData.user.id);

      const { data, error } = await supabase
        .from("skill_games")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      // Parse game_data if it's a string
      const gameData = typeof data.game_data === 'string' 
        ? JSON.parse(data.game_data) 
        : data.game_data;
      
      setGame({ ...data, game_data: gameData } as GameData);

      // Update status to in_progress
      if (data.status === "available") {
        await supabase
          .from("skill_games")
          .update({ 
            status: "in_progress", 
            last_played_at: new Date().toISOString() 
          })
          .eq("id", id);
      }
    } catch (error) {
      console.error("Error fetching game:", error);
      toast.error("Failed to load game");
      navigate("/games");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (result: {
    score: number;
    correctCount: number;
    totalQuestions: number;
    streakMax: number;
    timeSpentSeconds: number;
  }) => {
    if (!game || !userId) return;

    try {
      const passed = result.correctCount / result.totalQuestions >= 0.7;
      const scorePercentage = Math.round((result.correctCount / result.totalQuestions) * 100);

      // Record game session
      await supabase.from("game_sessions").insert({
        game_id: game.id,
        student_id: userId,
        score: result.score,
        correct_count: result.correctCount,
        total_questions: result.totalQuestions,
        streak_max: result.streakMax,
        time_spent_seconds: result.timeSpentSeconds,
        completed_at: new Date().toISOString(),
        xp_earned: passed ? game.xp_reward : 0,
        coins_earned: passed ? game.coin_reward : 0,
      });

      // Update game stats
      const updates: Record<string, unknown> = {
        attempts_count: (game.high_score !== null ? game.high_score : 0) + 1,
        last_played_at: new Date().toISOString(),
      };

      if (!game.high_score || result.score > game.high_score) {
        updates.high_score = result.score;
      }

      if (!game.status || game.status !== "completed") {
        if (passed) {
          updates.status = "completed";
        }
      }

      await supabase
        .from("skill_games")
        .update(updates)
        .eq("id", game.id);

      // Award XP and coins through secure edge function if passed
      if (passed) {
        // Check if already claimed to avoid duplicate attempts
        const alreadyClaimed = await checkIfClaimed("game", game.id);
        
        if (!alreadyClaimed) {
          const rewardResult = await awardRewards({
            claimType: "game",
            referenceId: game.id,
            xpAmount: game.xp_reward,
            coinAmount: game.coin_reward,
            reason: `Completed ${game.title} game with ${scorePercentage}%`,
            validationData: {
              score: scorePercentage,
              correct_answers: result.correctCount,
              questions_answered: result.totalQuestions,
              time_spent_seconds: result.timeSpentSeconds,
            },
          });

          if (rewardResult.success) {
            toast.success(`+${game.xp_reward} XP and +${game.coin_reward} coins earned!`);
          } else if (rewardResult.already_claimed) {
            toast.info("Game completed! Rewards already claimed.");
          } else {
            console.error("Failed to award rewards:", rewardResult.error);
          }
        } else {
          toast.info("Game completed! You've already earned rewards for this game.");
        }
      }
    } catch (error) {
      console.error("Error saving game result:", error);
    }
  };

  const handleExit = () => {
    navigate("/games");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Game not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl">
        {game.game_type === "flashcard_battle" && game.game_data.cards && (
          <FlashcardBattle
            cards={game.game_data.cards}
            title={game.title}
            difficulty={game.difficulty}
            xpReward={game.xp_reward}
            coinReward={game.coin_reward}
            onComplete={handleComplete}
            onExit={handleExit}
          />
        )}
        {game.game_type === "timed_challenge" && game.game_data.questions && (
          <TimedChallenge
            questions={game.game_data.questions}
            title={game.title}
            difficulty={game.difficulty}
            timePerQuestion={game.game_data.timePerQuestion || 15}
            xpReward={game.xp_reward}
            coinReward={game.coin_reward}
            onComplete={handleComplete}
            onExit={handleExit}
          />
        )}
        {game.game_type === "matching_puzzle" && game.game_data.pairs && (
          <MatchingPuzzle
            pairs={game.game_data.pairs}
            title={game.title}
            difficulty={game.difficulty}
            xpReward={game.xp_reward}
            coinReward={game.coin_reward}
            onComplete={handleComplete}
            onExit={handleExit}
          />
        )}
      </div>
    </div>
  );
}
