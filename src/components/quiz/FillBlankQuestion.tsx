import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FillBlankQuestionProps {
  sentence: string; // Contains _____ for blanks
  currentAnswer?: string;
  onAnswer: (answer: string) => void;
}

export function FillBlankQuestion({ sentence, currentAnswer, onAnswer }: FillBlankQuestionProps) {
  // Parse sentence to find blanks
  const parts = sentence.split(/_+/);
  const blankCount = parts.length - 1;
  
  const [answers, setAnswers] = useState<string[]>(() => {
    if (currentAnswer) {
      try {
        return JSON.parse(currentAnswer);
      } catch {
        return new Array(blankCount).fill("");
      }
    }
    return new Array(blankCount).fill("");
  });
  
  const [isConfirmed, setIsConfirmed] = useState(!!currentAnswer);

  const handleInputChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
    setIsConfirmed(false);
  };

  const handleConfirm = () => {
    if (answers.every(a => a.trim())) {
      onAnswer(JSON.stringify(answers));
      setIsConfirmed(true);
    }
  };

  const allFilled = answers.every(a => a.trim());

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-xl p-4">
        <p className="text-lg leading-relaxed">
          {parts.map((part, idx) => (
            <span key={idx}>
              {part}
              {idx < parts.length - 1 && (
                <span className="inline-flex items-center mx-1">
                  <Input
                    value={answers[idx]}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                    className={`w-32 h-8 text-base text-center inline-block mx-1 ${
                      isConfirmed ? "bg-primary/10 border-primary" : ""
                    }`}
                    placeholder={`blank ${idx + 1}`}
                    disabled={isConfirmed}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && allFilled) {
                        handleConfirm();
                      }
                    }}
                  />
                </span>
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Preview of answers */}
      {answers.some(a => a.trim()) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-4 border border-border"
        >
          <p className="text-sm text-muted-foreground mb-2">Your answers:</p>
          <div className="flex flex-wrap gap-2">
            {answers.map((answer, idx) => (
              <span
                key={idx}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  answer.trim()
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {idx + 1}. {answer || "(empty)"}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      <Button
        variant={isConfirmed ? "outline" : "default"}
        className="w-full"
        onClick={handleConfirm}
        disabled={!allFilled && !isConfirmed}
      >
        {isConfirmed ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Answers Confirmed
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Confirm Answers
          </>
        )}
      </Button>
    </div>
  );
}
