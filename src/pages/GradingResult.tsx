/**
 * GradingResult Page
 *
 * Displays assignment grading results with score and rewards.
 * Refactored to use common design tokens for grade colors.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { Confetti } from "@/components/Confetti";
import { ArrowLeft, Check, X, RefreshCw, Star, Trophy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSyncToNYCologic } from "@/hooks/useSyncToNYCologic";
import { getGradeColors } from "@/components/common/tokens/colors";
import { RewardBadge } from "@/components/common/RewardDisplay";
import { cn } from "@/lib/utils";

interface GradingData {
  score: number;
  totalQuestions: number;
  percentage: number;
  meetsThreshold: boolean;
  feedback: string;
  incorrectTopics: string[];
  xpEarned: number;
  coinsEarned: number;
}

export default function GradingResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get("assignment");
  const attemptId = searchParams.get("attempt");
  const urlScore = searchParams.get("score");
  const urlTotal = searchParams.get("total");
  const urlXp = searchParams.get("xp");
  const urlCoins = searchParams.get("coins");
  
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gradingData, setGradingData] = useState<GradingData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { syncAssignmentCompleted } = useSyncToNYCologic();

  const threshold = 70; // Passing threshold percentage

  useEffect(() => {
    // Check if we have URL params (from real grading)
    if (urlScore && urlTotal) {
      const score = parseInt(urlScore);
      const total = parseInt(urlTotal);
      const percentage = Math.round((score / total) * 100);
      const meetsThreshold = percentage >= threshold;
      
      const data: GradingData = {
        score,
        totalQuestions: total,
        percentage,
        meetsThreshold,
        feedback: meetsThreshold 
          ? percentage === 100 
            ? "Perfect score! You're a superstar! 🌟"
            : "Great job! You've shown strong understanding."
          : "Keep practicing! You're getting there!",
        incorrectTopics: meetsThreshold ? [] : ["Review the topics you missed"],
        xpEarned: urlXp ? parseInt(urlXp) : (meetsThreshold ? score * 10 : 0),
        coinsEarned: urlCoins ? parseInt(urlCoins) : (meetsThreshold ? score * 2 : 0),
      };
      
      setGradingData(data);
      setIsLoading(false);
      
      if (data.meetsThreshold) {
        setShowConfetti(true);
      }
      return;
    }

    // Fallback: simulate AI grading for demo
    const simulateGrading = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockData: GradingData = {
        score: 4,
        totalQuestions: 5,
        percentage: 80,
        meetsThreshold: true,
        feedback: "Great job! You've shown strong understanding of multiplication concepts.",
        incorrectTopics: ["Multi-digit multiplication"],
        xpEarned: 50,
        coinsEarned: 10,
      };
      
      setGradingData(mockData);
      setIsLoading(false);
      
      if (mockData.meetsThreshold) {
        setShowConfetti(true);
      }
    };
    
    simulateGrading();
  }, [assignmentId, attemptId, urlScore, urlTotal, urlXp, urlCoins]);

  const handleFinalSubmit = async () => {
    if (!gradingData) return;
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Sync to NYCologic
        await syncAssignmentCompleted({
          studentId: user.id,
          assignmentId: assignmentId || "demo",
          score: gradingData.score,
          totalQuestions: gradingData.totalQuestions,
          xpEarned: gradingData.xpEarned,
          coinsEarned: gradingData.coinsEarned,
          completedAt: new Date().toISOString(),
        });

        // Update student's XP and coins
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("xp, coins")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          await supabase
            .from("student_profiles")
            .update({
              xp: profile.xp + gradingData.xpEarned,
              coins: profile.coins + gradingData.coinsEarned,
            })
            .eq("user_id", user.id);
        }
      }
      
      navigate("/student/rewards-earned", {
        state: {
          xp: gradingData.xpEarned,
          coins: gradingData.coinsEarned,
          percentage: gradingData.percentage,
        },
      });
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    navigate(`/student/practice?assignment=${assignmentId}&topics=${gradingData?.incorrectTopics.join(",")}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <ScholarBuddy size="lg" message="Let me check your work..." />
          <div className="mt-8 flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg font-medium text-muted-foreground">AI is grading...</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">This usually takes a few seconds</p>
        </motion.div>
      </div>
    );
  }

  if (!gradingData) return null;

  return (
    <div className="min-h-screen bg-background">
      <Confetti active={showConfetti} />
      
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <Link to="/student">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <ScholarBuddy 
            size="lg" 
            message={gradingData.meetsThreshold 
              ? "Amazing work! You crushed it! 🎉" 
              : "Good effort! Let's practice and try again!"
            } 
          />

          {/* Score Display */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="mt-8"
          >
            {(() => {
              const gradeColors = getGradeColors(gradingData.percentage);
              return (
                <div className={cn(
                  "w-32 h-32 mx-auto rounded-full flex items-center justify-center",
                  gradingData.meetsThreshold
                    ? "bg-gradient-to-br from-success to-success/80"
                    : "bg-gradient-to-br from-warning to-warning/80"
                )}>
                  <div className="text-center text-white">
                    <p className="text-4xl font-extrabold">{gradingData.percentage}%</p>
                    <p className="text-sm opacity-80">{gradingData.score}/{gradingData.totalQuestions}</p>
                  </div>
                </div>
              );
            })()}
          </motion.div>

          {/* Result Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            {(() => {
              const gradeColors = getGradeColors(gradingData.percentage);
              return (
                <>
                  <h1 className={cn("text-2xl font-extrabold", gradeColors.text)}>
                    {gradingData.meetsThreshold ? "You Passed!" : "Almost There!"}
                  </h1>
                  <p className="text-muted-foreground mt-2">{gradingData.feedback}</p>
                </>
              );
            })()}
          </motion.div>

          {/* Progress to threshold */}
          {!gradingData.meetsThreshold && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 bg-card rounded-xl p-4 border border-border"
            >
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Your score</span>
                <span className="font-medium text-foreground">{gradingData.percentage}% / {threshold}% needed</span>
              </div>
              <Progress value={gradingData.percentage} className="h-3" />
            </motion.div>
          )}

          {/* Rewards Preview */}
          {gradingData.meetsThreshold && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-6 bg-gradient-gold rounded-2xl p-6 shadow-glow-gold"
            >
              <p className="text-gold-foreground font-bold text-lg mb-4">Rewards Ready!</p>
              <div className="flex items-center justify-center">
                <RewardBadge
                  xp={gradingData.xpEarned}
                  coins={gradingData.coinsEarned}
                  size="lg"
                  showPlus
                />
              </div>
            </motion.div>
          )}

          {/* Incorrect Topics */}
          {gradingData.incorrectTopics.length > 0 && !gradingData.meetsThreshold && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 bg-muted rounded-xl p-4 text-left"
            >
              <p className="font-medium text-foreground mb-2">Areas to practice:</p>
              <ul className="space-y-1">
                {gradingData.incorrectTopics.map((topic, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                    <X className="w-4 h-4 text-destructive" />
                    {topic}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-8 space-y-3"
          >
            {gradingData.meetsThreshold ? (
              <>
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="w-full"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Trophy className="w-5 h-5 mr-2" />
                      Submit & Claim Rewards
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                  onClick={handleRetry}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try for a Higher Score
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="w-full"
                  onClick={handleRetry}
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Practice & Retry
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Submit Anyway
                    </>
                  )}
                </Button>
              </>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
