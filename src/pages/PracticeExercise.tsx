import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { DragOrderQuestion } from "@/components/quiz/DragOrderQuestion";
import { MatchingQuestion } from "@/components/quiz/MatchingQuestion";
import { FillBlankQuestion } from "@/components/quiz/FillBlankQuestion";
import { Confetti } from "@/components/Confetti";
import { useSecureRewards } from "@/hooks/useSecureRewards";
import {
  ArrowLeft, ArrowRight, Lightbulb, Check, X, Loader2,
  Trophy, Zap, Award, RotateCcw, Home
} from "lucide-react";

interface PracticeQuestion {
  id: string;
  prompt: string;
  question_type: string;
  options: string[] | { left: string; right: string }[] | null;
  answer_key: any;
  hint: string | null;
  difficulty: number;
  skill_tag: string | null;
  order_index: number;
}

interface PracticeSetData {
  id: string;
  title: string;
  xp_reward: number;
  coin_reward: number;
}

export default function PracticeExercise() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { awardRewards, checkIfClaimed } = useSecureRewards();
  
  const [loading, setLoading] = useState(true);
  const [practiceSet, setPracticeSet] = useState<PracticeSetData | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showHint, setShowHint] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rewardsEarned, setRewardsEarned] = useState<{ xp: number; coins: number } | null>(null);

  useEffect(() => {
    if (id) {
      fetchPracticeData();
    }
  }, [id]);

  const fetchPracticeData = async () => {
    try {
      const { data: set, error: setError } = await supabase
        .from("practice_sets")
        .select("id, title, xp_reward, coin_reward")
        .eq("id", id)
        .single();

      if (setError) throw setError;
      setPracticeSet(set);

      const { data: questionsData, error: questionsError } = await supabase
        .from("practice_questions")
        .select("*")
        .eq("practice_set_id", id)
        .order("order_index", { ascending: true });

      if (questionsError) throw questionsError;
      
      // Parse options from JSON
      const parsedQuestions = (questionsData || []).map(q => ({
        ...q,
        options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null,
        answer_key: typeof q.answer_key === 'string' ? JSON.parse(q.answer_key) : q.answer_key,
      }));
      
      setQuestions(parsedQuestions);
    } catch (error) {
      console.error("Error fetching practice data:", error);
      toast({
        title: "Error",
        description: "Failed to load practice questions",
        variant: "destructive",
      });
      navigate("/student/practice-center");
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const checkAnswer = (userAnswer: string): boolean => {
    if (!currentQuestion) return false;
    
    const answerKey = currentQuestion.answer_key;
    const questionType = currentQuestion.question_type;

    if (questionType === "multiple_choice") {
      return userAnswer === answerKey.correct;
    }
    
    if (questionType === "short_answer" || questionType === "numeric") {
      const acceptable = answerKey.acceptable || [answerKey.correct];
      return acceptable.some((ans: string) => 
        ans.toLowerCase().trim() === userAnswer.toLowerCase().trim()
      );
    }
    
    if (questionType === "drag_order") {
      try {
        const userOrder = JSON.parse(userAnswer);
        const correctOrder = answerKey.correct;
        return JSON.stringify(userOrder) === JSON.stringify(correctOrder);
      } catch {
        return false;
      }
    }
    
    if (questionType === "matching") {
      try {
        const userMatches = JSON.parse(userAnswer);
        const correctMatches = answerKey.correct;
        return Object.keys(correctMatches).every(
          key => userMatches[key] === correctMatches[key]
        );
      } catch {
        return false;
      }
    }

    if (questionType === "fill_blank") {
      try {
        const userAnswers = JSON.parse(userAnswer);
        const correctAnswers = answerKey.blanks || answerKey.correct;
        return correctAnswers.every((correct: string, idx: number) => {
          const acceptable = Array.isArray(correct) ? correct : [correct];
          return acceptable.some((ans: string) => 
            ans.toLowerCase().trim() === (userAnswers[idx] || "").toLowerCase().trim()
          );
        });
      } catch {
        return false;
      }
    }

    return false;
  };

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const handleCheckAnswer = () => {
    const userAnswer = answers[currentQuestion.id];
    if (!userAnswer) {
      toast({
        title: "Answer Required",
        description: "Please provide an answer before checking",
        variant: "destructive",
      });
      return;
    }

    const isCorrect = checkAnswer(userAnswer);
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowHint(false);
      setShowResult(false);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsComplete(true);
    const score = Math.round((correctCount / questions.length) * 100);
    
    if (score >= 70) {
      setShowConfetti(true);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !practiceSet) return;

      // Update practice set as completed
      await supabase
        .from("practice_sets")
        .update({
          status: "completed",
          score,
          completed_at: new Date().toISOString(),
        })
        .eq("id", id);

      // Award XP and coins through secure edge function if passed
      if (score >= 60) {
        // Check if already claimed
        const alreadyClaimed = await checkIfClaimed("practice_set", practiceSet.id);
        
        if (!alreadyClaimed) {
          const rewardResult = await awardRewards({
            claimType: "practice_set",
            referenceId: practiceSet.id,
            xpAmount: practiceSet.xp_reward,
            coinAmount: practiceSet.coin_reward,
            reason: `Completed practice: ${practiceSet.title} with ${score}%`,
            validationData: {
              score,
              correct_answers: correctCount,
              questions_answered: questions.length,
            },
          });

          if (rewardResult.success) {
            setRewardsEarned({ xp: practiceSet.xp_reward, coins: practiceSet.coin_reward });
            toast({
              title: score >= 70 ? "Great job! 🎉" : "Practice Complete",
              description: `You earned +${practiceSet.xp_reward} XP and +${practiceSet.coin_reward} coins!`,
            });
          } else if (rewardResult.already_claimed) {
            toast({
              title: "Practice Complete",
              description: "Rewards already claimed for this practice set.",
            });
          } else {
            console.error("Failed to award rewards:", rewardResult.error);
            toast({
              title: "Practice Complete",
              description: "Keep practicing to improve your skills!",
            });
          }
        } else {
          toast({
            title: "Practice Complete",
            description: "You've already earned rewards for this practice set.",
          });
        }
      } else {
        toast({
          title: "Practice Complete",
          description: "Score 60% or higher to earn rewards. Keep practicing!",
        });
      }
    } catch (error) {
      console.error("Error completing practice:", error);
    }
  };

  const isCorrect = showResult && checkAnswer(answers[currentQuestion?.id] || "");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isComplete) {
    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= 60;

    return (
      <div className="min-h-screen bg-background">
        <Confetti active={showConfetti} />
        
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/student/practice-center")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Practice Center
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <ScholarBuddy 
              size="lg" 
              message={passed 
                ? "Excellent work! You're making great progress! 🌟" 
                : "Good effort! Let's keep practicing to get stronger!"
              } 
            />

            <div className="mt-8">
              <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
                passed ? "bg-success" : "bg-primary"
              }`}>
                <Trophy className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold mt-6 text-foreground">
              {passed ? "Practice Complete!" : "Keep Going!"}
            </h1>
            
            <div className="mt-4 space-y-2">
              <div className="text-4xl font-bold text-primary">{score}%</div>
              <p className="text-muted-foreground">
                {correctCount} out of {questions.length} correct
              </p>
            </div>

            {rewardsEarned && (
              <div className="mt-6 flex justify-center gap-4">
                <Badge variant="outline" className="text-lg py-2 px-4 bg-primary/10 text-primary">
                  <Zap className="w-4 h-4 mr-2" />
                  +{rewardsEarned.xp} XP
                </Badge>
                <Badge variant="outline" className="text-lg py-2 px-4 bg-gold/10 text-gold">
                  <Award className="w-4 h-4 mr-2" />
                  +{rewardsEarned.coins} coins
                </Badge>
              </div>
            )}

            <div className="mt-8 space-y-3">
              <Button 
                variant="hero" 
                size="xl" 
                className="w-full"
                onClick={() => navigate("/student/practice-center")}
              >
                <Home className="w-5 h-5 mr-2" />
                Back to Practice Center
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full"
                onClick={() => {
                  setCurrentIndex(0);
                  setAnswers({});
                  setShowHint(false);
                  setShowResult(false);
                  setCorrectCount(0);
                  setIsComplete(false);
                  setShowConfetti(false);
                  setRewardsEarned(null);
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No questions found</p>
          <Button onClick={() => navigate("/student/practice-center")}>
            Back to Practice Center
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate("/student/practice-center")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
            {currentQuestion.skill_tag && (
              <Badge variant="secondary">{currentQuestion.skill_tag}</Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Progress */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {practiceSet?.title || "Practice"}
          </p>
        </div>

        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <ScholarBuddy 
            size="sm" 
            message={showResult 
              ? (isCorrect ? "Excellent! You've got it! 🎉" : "Let me help explain that...")
              : "Take your time and think it through!"
            } 
          />

          {/* Question Card */}
          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="text-xs">
                {currentQuestion.question_type.replace("_", " ")}
              </Badge>
              {currentQuestion.difficulty > 1 && (
                <Badge variant="secondary" className="text-xs">
                  {"⭐".repeat(currentQuestion.difficulty)}
                </Badge>
              )}
            </div>

            <h2 className="text-xl font-bold text-foreground mb-6">
              {currentQuestion.prompt}
            </h2>

            {/* Question Type Renderers */}
            {currentQuestion.question_type === "multiple_choice" && currentQuestion.options && (
              <div className="grid gap-3">
                {(currentQuestion.options as string[]).map((option) => {
                  let variant: "outline" | "success" | "destructive" = "outline";
                  const userAnswer = answers[currentQuestion.id];
                  
                  if (showResult) {
                    if (option === currentQuestion.answer_key.correct) {
                      variant = "success";
                    } else if (option === userAnswer && !isCorrect) {
                      variant = "destructive";
                    }
                  }

                  return (
                    <Button
                      key={option}
                      variant={variant}
                      className={`w-full justify-start h-14 text-lg ${
                        userAnswer === option && !showResult ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => !showResult && handleAnswer(option)}
                      disabled={showResult}
                    >
                      {option}
                      {showResult && option === currentQuestion.answer_key.correct && (
                        <Check className="w-5 h-5 ml-auto" />
                      )}
                      {showResult && option === userAnswer && !isCorrect && (
                        <X className="w-5 h-5 ml-auto" />
                      )}
                    </Button>
                  );
                })}
              </div>
            )}

            {(currentQuestion.question_type === "short_answer" || currentQuestion.question_type === "numeric") && (
              <input
                type={currentQuestion.question_type === "numeric" ? "number" : "text"}
                className="w-full p-4 border border-border rounded-xl bg-background text-foreground text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder={currentQuestion.question_type === "numeric" ? "Enter a number..." : "Type your answer..."}
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswer(e.target.value)}
                disabled={showResult}
              />
            )}

            {currentQuestion.question_type === "drag_order" && currentQuestion.options && (
              <DragOrderQuestion
                items={currentQuestion.options as string[]}
                currentAnswer={answers[currentQuestion.id]}
                onAnswer={handleAnswer}
              />
            )}

            {currentQuestion.question_type === "matching" && currentQuestion.options && (
              <MatchingQuestion
                pairs={currentQuestion.options as { left: string; right: string }[]}
                currentAnswer={answers[currentQuestion.id]}
                onAnswer={handleAnswer}
              />
            )}

            {currentQuestion.question_type === "fill_blank" && (
              <FillBlankQuestion
                sentence={currentQuestion.prompt}
                currentAnswer={answers[currentQuestion.id]}
                onAnswer={handleAnswer}
              />
            )}
          </div>

          {/* Hint Button */}
          {currentQuestion.hint && !showHint && !showResult && (
            <Button
              variant="ghost"
              className="mt-4 w-full"
              onClick={() => setShowHint(true)}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Need a hint?
            </Button>
          )}

          {/* Hint Display */}
          {showHint && currentQuestion.hint && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-primary/10 rounded-xl border border-primary/20"
            >
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-primary mt-0.5" />
                <p className="text-sm text-foreground">{currentQuestion.hint}</p>
              </div>
            </motion.div>
          )}

          {/* Result Feedback */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-4 rounded-xl ${
                isCorrect 
                  ? "bg-success/10 border border-success/20" 
                  : "bg-destructive/10 border border-destructive/20"
              }`}
            >
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <Check className="w-5 h-5 text-success" />
                ) : (
                  <X className="w-5 h-5 text-destructive" />
                )}
                <span className={isCorrect ? "text-success" : "text-destructive"}>
                  {isCorrect ? "Correct!" : "Not quite right"}
                </span>
              </div>
              {!isCorrect && (
                <p className="mt-2 text-sm text-muted-foreground">
                  The correct answer is: {
                    typeof currentQuestion.answer_key.correct === 'object'
                      ? JSON.stringify(currentQuestion.answer_key.correct)
                      : currentQuestion.answer_key.correct
                  }
                </p>
              )}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            {!showResult ? (
              <Button 
                className="flex-1" 
                size="lg"
                onClick={handleCheckAnswer}
                disabled={!answers[currentQuestion.id]}
              >
                Check Answer
              </Button>
            ) : (
              <Button 
                className="flex-1" 
                size="lg"
                onClick={handleNext}
              >
                {currentIndex < questions.length - 1 ? (
                  <>
                    Next Question
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  "Complete Practice"
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
