import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MatchingQuestionProps {
  pairs: { left: string; right: string }[];
  currentAnswer?: string;
  onAnswer: (answer: string) => void;
}

export function MatchingQuestion({ pairs, currentAnswer, onAnswer }: MatchingQuestionProps) {
  // Shuffle right side options
  const [rightOptions] = useState(() => 
    [...pairs].map(p => p.right).sort(() => Math.random() - 0.5)
  );
  
  // Track matches: { leftItem: rightItem }
  const [matches, setMatches] = useState<Record<string, string>>(() => {
    if (currentAnswer) {
      try {
        return JSON.parse(currentAnswer);
      } catch {
        return {};
      }
    }
    return {};
  });
  
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(!!currentAnswer);

  const handleLeftClick = (item: string) => {
    if (isConfirmed) return;
    setSelectedLeft(item);
  };

  const handleRightClick = (item: string) => {
    if (isConfirmed || !selectedLeft) return;
    
    // Remove any existing match for this right item
    const newMatches = { ...matches };
    Object.keys(newMatches).forEach(key => {
      if (newMatches[key] === item) {
        delete newMatches[key];
      }
    });
    
    // Add new match
    newMatches[selectedLeft] = item;
    setMatches(newMatches);
    setSelectedLeft(null);
  };

  const handleClearMatch = (leftItem: string) => {
    if (isConfirmed) return;
    const newMatches = { ...matches };
    delete newMatches[leftItem];
    setMatches(newMatches);
  };

  const handleConfirm = () => {
    if (Object.keys(matches).length === pairs.length) {
      onAnswer(JSON.stringify(matches));
      setIsConfirmed(true);
    }
  };

  const allMatched = Object.keys(matches).length === pairs.length;
  const getMatchedRight = (leftItem: string) => matches[leftItem];
  const isRightMatched = (rightItem: string) => Object.values(matches).includes(rightItem);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center mb-2">
        Tap a left item, then tap its match on the right
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2">
          {pairs.map((pair, idx) => {
            const matched = getMatchedRight(pair.left);
            const isSelected = selectedLeft === pair.left;
            
            return (
              <motion.button
                key={`left-${idx}`}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                  matched
                    ? "bg-success/10 border-success"
                    : isSelected
                    ? "bg-primary/10 border-primary ring-2 ring-primary ring-offset-2"
                    : "bg-card border-border hover:border-primary/50"
                }`}
                onClick={() => matched ? handleClearMatch(pair.left) : handleLeftClick(pair.left)}
                whileTap={{ scale: 0.98 }}
                disabled={isConfirmed}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{pair.left}</span>
                  {matched && (
                    <Link2 className="w-4 h-4 text-success ml-auto" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {rightOptions.map((item, idx) => {
            const isMatched = isRightMatched(item);
            
            return (
              <motion.button
                key={`right-${idx}`}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                  isMatched
                    ? "bg-success/10 border-success"
                    : selectedLeft
                    ? "bg-muted border-primary/50 hover:border-primary"
                    : "bg-card border-border"
                }`}
                onClick={() => handleRightClick(item)}
                whileTap={{ scale: 0.98 }}
                disabled={isConfirmed || !selectedLeft || isMatched}
              >
                <span className="font-medium text-sm">{item}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Match summary */}
      {Object.keys(matches).length > 0 && (
        <div className="bg-muted/50 rounded-xl p-3 mt-4">
          <p className="text-xs text-muted-foreground mb-2">Your matches:</p>
          <div className="space-y-1">
            {Object.entries(matches).map(([left, right]) => (
              <div key={left} className="flex items-center gap-2 text-sm">
                <span className="font-medium">{left}</span>
                <span className="text-muted-foreground">→</span>
                <span>{right}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        variant={isConfirmed ? "outline" : "default"}
        className="w-full mt-4"
        onClick={handleConfirm}
        disabled={!allMatched && !isConfirmed}
      >
        {isConfirmed ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Matches Confirmed
          </>
        ) : allMatched ? (
          "Confirm Matches"
        ) : (
          `Match all pairs (${Object.keys(matches).length}/${pairs.length})`
        )}
      </Button>
    </div>
  );
}
