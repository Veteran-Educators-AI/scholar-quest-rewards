import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, RotateCcw, Trophy, Flame, Clock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Confetti } from "@/components/Confetti";

interface FlashCard {
  id: string;
  front: string;
  back: string;
  hint?: string;
}

interface FlashcardBattleProps {
  cards: FlashCard[];
  title: string;
  difficulty: number;
  xpReward: number;
  coinReward: number;
  onComplete: (result: {
    score: number;
    correctCount: number;
    totalQuestions: number;
    streakMax: number;
    timeSpentSeconds: number;
  }) => void;
  onExit: () => void;
}

export default function FlashcardBattle({
  cards,
  title,
  difficulty,
  xpReward,
  coinReward,
  onComplete,
  onExit,
}: FlashcardBattleProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<"correct" | "wrong" | null>(null);

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex) / cards.length) * 100;

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  const handleAnswer = (isCorrect: boolean) => {
    setLastAnswer(isCorrect ? "correct" : "wrong");
    
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak);
      }
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      setLastAnswer(null);
      if (currentIndex + 1 >= cards.length) {
        finishGame(isCorrect);
      } else {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
        setShowHint(false);
      }
    }, 500);
  };

  const finishGame = (lastCorrect: boolean) => {
    const finalCorrect = correctCount + (lastCorrect ? 1 : 0);
    const finalStreak = lastCorrect ? Math.max(maxStreak, streak + 1) : maxStreak;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const score = Math.round((finalCorrect / cards.length) * 100 * (1 + finalStreak * 0.1));

    if (finalCorrect / cards.length >= 0.8) {
      setShowConfetti(true);
    }

    setIsComplete(true);
    onComplete({
      score,
      correctCount: finalCorrect,
      totalQuestions: cards.length,
      streakMax: finalStreak,
      timeSpentSeconds: timeSpent,
    });
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isComplete) return;
      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleFlip, isComplete]);

  if (isComplete) {
    const percentage = Math.round((correctCount / cards.length) * 100);
    const passed = percentage >= 70;

    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6">
        {showConfetti && <Confetti active={showConfetti} />}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
            passed ? "bg-green-100 dark:bg-green-900/30" : "bg-orange-100 dark:bg-orange-900/30"
          )}>
            <Trophy className={cn(
              "w-10 h-10",
              passed ? "text-green-600" : "text-orange-600"
            )} />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {passed ? "Battle Won! 🎉" : "Keep Practicing!"}
          </h2>
          <p className="text-muted-foreground mb-6">
            You got {correctCount} out of {cards.length} correct
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-6">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{percentage}%</div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-500 flex items-center justify-center gap-1">
                <Flame className="w-5 h-5" />
                {maxStreak}
              </div>
              <div className="text-xs text-muted-foreground">Max Streak</div>
            </div>
          </div>

          {passed && (
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-1 text-primary">
                <Zap className="w-4 h-4" />
                <span className="font-semibold">+{xpReward} XP</span>
              </div>
              <div className="flex items-center gap-1 text-yellow-500">
                <span className="text-lg">🪙</span>
                <span className="font-semibold">+{coinReward}</span>
              </div>
            </div>
          )}

          <Button onClick={onExit} size="lg">
            Continue
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-lg">{title}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Card {currentIndex + 1}/{cards.length}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              {streak} streak
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>
          Exit
        </Button>
      </div>

      {/* Progress */}
      <Progress value={progress} className="mb-6 h-2" />

      {/* Flashcard */}
      <div className="relative perspective-1000 mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentIndex}-${lastAnswer}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              scale: lastAnswer ? (lastAnswer === "correct" ? 1.02 : 0.98) : 1,
            }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              className={cn(
                "min-h-[250px] cursor-pointer transition-all duration-300",
                lastAnswer === "correct" && "ring-4 ring-green-500",
                lastAnswer === "wrong" && "ring-4 ring-red-500"
              )}
              onClick={handleFlip}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[250px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isFlipped ? "back" : "front"}
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-center"
                  >
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                      {isFlipped ? "Answer" : "Question"}
                    </div>
                    <p className="text-xl font-medium">
                      {isFlipped ? currentCard.back : currentCard.front}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {!isFlipped && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Tap or press Space to flip
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hint */}
      {!isFlipped && currentCard.hint && (
        <div className="text-center mb-4">
          {showHint ? (
            <p className="text-sm text-muted-foreground italic">{currentCard.hint}</p>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setShowHint(true)}>
              Show Hint
            </Button>
          )}
        </div>
      )}

      {/* Answer Buttons */}
      {isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4"
        >
          <Button
            variant="outline"
            className="flex-1 h-14 text-lg border-red-200 hover:bg-red-50 hover:border-red-400 dark:border-red-800 dark:hover:bg-red-950"
            onClick={() => handleAnswer(false)}
          >
            <XCircle className="w-5 h-5 mr-2 text-red-500" />
            Got it Wrong
          </Button>
          <Button
            className="flex-1 h-14 text-lg bg-green-600 hover:bg-green-700"
            onClick={() => handleAnswer(true)}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Got it Right
          </Button>
        </motion.div>
      )}
    </div>
  );
}
