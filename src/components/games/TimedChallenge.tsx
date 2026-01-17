import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Zap, Trophy, Flame, CheckCircle, XCircle, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Confetti } from "@/components/Confetti";
import { useQuizSounds } from "@/hooks/useQuizSounds";

interface Question {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  hint?: string;
}

interface TimedChallengeProps {
  questions: Question[];
  title: string;
  difficulty: number;
  timePerQuestion: number; // seconds
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

export default function TimedChallenge({
  questions,
  title,
  difficulty,
  timePerQuestion,
  xpReward,
  coinReward,
  onComplete,
  onExit,
}: TimedChallengeProps) {
  const [gameState, setGameState] = useState<"ready" | "playing" | "complete">("ready");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const { playCorrectSound, playIncorrectSound, playStreakSound, playCompletionSound, playTimeoutSound } = useQuizSounds();

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  const timeProgress = (timeLeft / timePerQuestion) * 100;

  // Timer effect
  useEffect(() => {
    if (gameState !== "playing" || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, showResult, currentIndex]);

  const handleTimeout = () => {
    setStreak(0);
    playTimeoutSound();
    setShowResult(true);
    setTimeout(() => moveToNext(), 1500);
  };

  const handleAnswer = (answer: string) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    const isCorrect = answer === currentQuestion.correctAnswer;

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak);
      }
      // Play sound feedback
      if (newStreak >= 3 && newStreak % 3 === 0) {
        playStreakSound(newStreak);
      } else {
        playCorrectSound();
      }
    } else {
      setStreak(0);
      playIncorrectSound();
    }

    setShowResult(true);
    setTimeout(() => moveToNext(), 1000);
  };

  const moveToNext = () => {
    if (currentIndex + 1 >= questions.length) {
      finishGame();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(timePerQuestion);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const finishGame = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const bonusMultiplier = 1 + (maxStreak * 0.1) + ((5 - difficulty) * 0.05);
    const score = Math.round((correctCount / questions.length) * 100 * bonusMultiplier);

    if (correctCount / questions.length >= 0.8) {
      setShowConfetti(true);
    }

    playCompletionSound();
    setGameState("complete");
    onComplete({
      score,
      correctCount,
      totalQuestions: questions.length,
      streakMax: maxStreak,
      timeSpentSeconds: timeSpent,
    });
  };

  const startGame = () => {
    setGameState("playing");
    setStartTime(Date.now());
  };

  if (gameState === "ready") {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground mb-4">
            Answer {questions.length} questions as fast as you can!
          </p>
          <div className="flex items-center justify-center gap-4 mb-6 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{timePerQuestion}s per question</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-primary" />
              <span>{xpReward} XP</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onExit}>
              Cancel
            </Button>
            <Button onClick={startGame} size="lg">
              <Play className="w-4 h-4 mr-2" />
              Start Challenge
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameState === "complete") {
    const percentage = Math.round((correctCount / questions.length) * 100);
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
            {passed ? "Challenge Complete! 🎉" : "Keep Practicing!"}
          </h2>
          <p className="text-muted-foreground mb-6">
            You got {correctCount} out of {questions.length} correct
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-6">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{percentage}%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
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
            <span>Question {currentIndex + 1}/{questions.length}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              {streak}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>
          Exit
        </Button>
      </div>

      {/* Timer */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">Time</span>
          <span className={cn(
            "text-sm font-bold flex items-center gap-1",
            timeLeft <= 5 ? "text-red-500" : "text-muted-foreground"
          )}>
            <Clock className="w-4 h-4" />
            {timeLeft}s
          </span>
        </div>
        <Progress 
          value={timeProgress} 
          className={cn("h-2", timeLeft <= 5 && "bg-red-100")}
        />
      </div>

      {/* Progress */}
      <Progress value={progress} className="mb-6 h-1" />

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
        >
          <Card className="mb-6">
            <CardContent className="p-6">
              <p className="text-lg font-medium text-center">
                {currentQuestion.prompt}
              </p>
            </CardContent>
          </Card>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.correctAnswer;
              const showCorrectness = showResult;

              return (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleAnswer(option)}
                  disabled={showResult}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left transition-all",
                    !showResult && "hover:border-primary hover:bg-primary/5",
                    !showResult && !isSelected && "border-border",
                    showCorrectness && isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20",
                    showCorrectness && isSelected && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-900/20",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option}</span>
                    {showCorrectness && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {showCorrectness && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
