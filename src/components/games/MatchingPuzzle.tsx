import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Zap, Trophy, Flame, Clock, Shuffle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Confetti } from "@/components/Confetti";
import { useQuizSounds } from "@/hooks/useQuizSounds";

interface MatchPair {
  id: string;
  term: string;
  definition: string;
}

interface MatchingPuzzleProps {
  pairs: MatchPair[];
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

interface CardState {
  id: string;
  content: string;
  type: "term" | "definition";
  pairId: string;
  isMatched: boolean;
}

export default function MatchingPuzzle({
  pairs,
  title,
  difficulty,
  xpReward,
  coinReward,
  onComplete,
  onExit,
}: MatchingPuzzleProps) {
  const [cards, setCards] = useState<CardState[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardState | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [wrongPair, setWrongPair] = useState<string[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const { playCorrectSound, playIncorrectSound, playStreakSound, playCompletionSound } = useQuizSounds();

  // Initialize cards
  useEffect(() => {
    const termCards: CardState[] = pairs.map((p) => ({
      id: `term-${p.id}`,
      content: p.term,
      type: "term" as const,
      pairId: p.id,
      isMatched: false,
    }));

    const defCards: CardState[] = pairs.map((p) => ({
      id: `def-${p.id}`,
      content: p.definition,
      type: "definition" as const,
      pairId: p.id,
      isMatched: false,
    }));

    // Shuffle both arrays
    const shuffledTerms = [...termCards].sort(() => Math.random() - 0.5);
    const shuffledDefs = [...defCards].sort(() => Math.random() - 0.5);

    setCards([...shuffledTerms, ...shuffledDefs]);
  }, [pairs]);

  // Timer
  useEffect(() => {
    if (isComplete) return;
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, isComplete]);

  const handleCardClick = (card: CardState) => {
    if (card.isMatched || wrongPair.includes(card.id)) return;

    if (!selectedCard) {
      setSelectedCard(card);
      return;
    }

    // Can't select same type
    if (selectedCard.type === card.type) {
      setSelectedCard(card);
      return;
    }

    setAttempts((prev) => prev + 1);

    // Check if match
    if (selectedCard.pairId === card.pairId) {
      // Correct match!
      const newMatched = new Set(matchedPairs);
      newMatched.add(card.pairId);
      setMatchedPairs(newMatched);

      setCards((prev) =>
        prev.map((c) =>
          c.pairId === card.pairId ? { ...c, isMatched: true } : c
        )
      );

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

      setSelectedCard(null);

      // Check completion
      if (newMatched.size === pairs.length) {
        finishGame(newStreak);
      }
    } else {
      // Wrong match
      setWrongPair([selectedCard.id, card.id]);
      setStreak(0);
      playIncorrectSound();

      setTimeout(() => {
        setWrongPair([]);
        setSelectedCard(null);
      }, 800);
    }
  };

  const finishGame = (finalStreak: number) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const accuracy = pairs.length / attempts;
    const timeBonus = Math.max(0, 1 - (timeSpent / (pairs.length * 10)));
    const score = Math.round((accuracy * 100) + (finalStreak * 10) + (timeBonus * 20));

    playCompletionSound();
    setShowConfetti(true);
    setIsComplete(true);

    onComplete({
      score: Math.min(score, 100),
      correctCount: pairs.length,
      totalQuestions: pairs.length,
      streakMax: finalStreak,
      timeSpentSeconds: timeSpent,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = (matchedPairs.size / pairs.length) * 100;

  if (isComplete) {
    const accuracy = Math.round((pairs.length / attempts) * 100);

    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6">
        {showConfetti && <Confetti active={showConfetti} />}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Puzzle Complete! 🧩</h2>
          <p className="text-muted-foreground mb-6">
            All {pairs.length} pairs matched!
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-6">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-primary">{accuracy}%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-orange-500 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4" />
                {maxStreak}
              </div>
              <div className="text-xs text-muted-foreground">Streak</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-blue-500 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(elapsedTime)}
              </div>
              <div className="text-xs text-muted-foreground">Time</div>
            </div>
          </div>

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

          <Button onClick={onExit} size="lg">
            Continue
          </Button>
        </motion.div>
      </div>
    );
  }

  const termCards = cards.filter((c) => c.type === "term");
  const defCards = cards.filter((c) => c.type === "definition");

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-lg">{title}</h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(elapsedTime)}
            </span>
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

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>Matched</span>
          <span>{matchedPairs.size}/{pairs.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Instructions */}
      <p className="text-sm text-muted-foreground text-center mb-4">
        Match terms with their definitions
      </p>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Terms Column */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-center text-muted-foreground uppercase tracking-wide mb-2">
            Terms
          </div>
          {termCards.map((card) => (
            <motion.button
              key={card.id}
              layout
              onClick={() => handleCardClick(card)}
              disabled={card.isMatched}
              className={cn(
                "w-full p-3 rounded-lg border-2 text-sm font-medium text-left transition-all",
                card.isMatched && "opacity-50 bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700",
                !card.isMatched && selectedCard?.id === card.id && "border-primary bg-primary/10",
                !card.isMatched && selectedCard?.id !== card.id && "border-border hover:border-primary/50",
                wrongPair.includes(card.id) && "border-red-500 bg-red-50 dark:bg-red-900/20 animate-shake"
              )}
            >
              <div className="flex items-center gap-2">
                {card.isMatched && <Sparkles className="w-4 h-4 text-green-500 shrink-0" />}
                <span className={card.isMatched ? "line-through text-muted-foreground" : ""}>
                  {card.content}
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Definitions Column */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-center text-muted-foreground uppercase tracking-wide mb-2">
            Definitions
          </div>
          {defCards.map((card) => (
            <motion.button
              key={card.id}
              layout
              onClick={() => handleCardClick(card)}
              disabled={card.isMatched}
              className={cn(
                "w-full p-3 rounded-lg border-2 text-sm text-left transition-all",
                card.isMatched && "opacity-50 bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700",
                !card.isMatched && selectedCard?.id === card.id && "border-primary bg-primary/10",
                !card.isMatched && selectedCard?.id !== card.id && "border-border hover:border-primary/50",
                wrongPair.includes(card.id) && "border-red-500 bg-red-50 dark:bg-red-900/20 animate-shake"
              )}
            >
              <div className="flex items-center gap-2">
                {card.isMatched && <Sparkles className="w-4 h-4 text-green-500 shrink-0" />}
                <span className={card.isMatched ? "line-through text-muted-foreground" : ""}>
                  {card.content}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
