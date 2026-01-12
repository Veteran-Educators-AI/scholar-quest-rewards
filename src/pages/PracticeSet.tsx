import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { ArrowLeft, Lightbulb, ArrowRight, Check, X } from "lucide-react";

interface PracticeQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  hint: string;
  explanation: string;
}

const practiceQuestions: PracticeQuestion[] = [
  {
    id: "p1",
    prompt: "What is 6 × 7?",
    options: ["36", "42", "48", "49"],
    answer: "42",
    hint: "Think of it as 6 groups of 7, or 7 + 7 + 7 + 7 + 7 + 7",
    explanation: "6 × 7 = 42. You can remember this as '6 × 7 = 42, which is also 7 × 6'",
  },
  {
    id: "p2",
    prompt: "What is 8 × 9?",
    options: ["63", "72", "81", "64"],
    answer: "72",
    hint: "8 × 9 is the same as (8 × 10) - 8",
    explanation: "8 × 9 = 72. A trick: 8 × 9 = 80 - 8 = 72",
  },
  {
    id: "p3",
    prompt: "What is 7 × 7?",
    options: ["42", "48", "49", "56"],
    answer: "49",
    hint: "This is a square number - 7 times itself!",
    explanation: "7 × 7 = 49. This is called 'seven squared'",
  },
];

export default function PracticeSet() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get("assignment");
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const question = practiceQuestions[currentQuestion];
  const isCorrect = selectedAnswer === question.answer;
  const progress = ((currentQuestion + 1) / practiceQuestions.length) * 100;

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    if (answer === question.answer) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < practiceQuestions.length - 1) {
      setCurrentQuestion((c) => c + 1);
      setSelectedAnswer(null);
      setShowHint(false);
      setShowResult(false);
    } else {
      setIsComplete(true);
    }
  };

  const handleRetryAssignment = () => {
    navigate(`/student/assignment/${assignmentId}?retry=true`);
  };

  if (isComplete) {
    const allCorrect = correctCount === practiceQuestions.length;
    
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/student")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
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
              message={allCorrect 
                ? "Perfect practice! You're ready to ace that assignment! 🌟" 
                : "Great practice session! You're getting better!"
              } 
            />

            <div className="mt-8">
              <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
                allCorrect ? "bg-success" : "bg-primary"
              }`}>
                <Check className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold mt-6 text-foreground">Practice Complete!</h1>
            <p className="text-muted-foreground mt-2">
              You got {correctCount} out of {practiceQuestions.length} correct
            </p>

            <div className="mt-8 space-y-3">
              <Button 
                variant="hero" 
                size="xl" 
                className="w-full"
                onClick={handleRetryAssignment}
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Retry Assignment
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full"
                onClick={() => {
                  setCurrentQuestion(0);
                  setSelectedAnswer(null);
                  setShowHint(false);
                  setShowResult(false);
                  setCorrectCount(0);
                  setIsComplete(false);
                }}
              >
                Practice Again
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {currentQuestion + 1} / {practiceQuestions.length}
              </span>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2 text-center">Warm-up Practice</p>
        </div>

        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <ScholarBuddy 
            size="sm" 
            message={showResult 
              ? (isCorrect ? "Excellent! You've got it!" : "Let me explain that...") 
              : "Take your time and think it through!"
            } 
          />

          {/* Question Card */}
          <div className="bg-card rounded-2xl p-6 shadow-lg border border-border mt-6">
            <h2 className="text-xl font-bold text-foreground mb-6">
              {question.prompt}
            </h2>

            <div className="grid gap-3">
              {question.options.map((option) => {
                let variant: "outline" | "success" | "destructive" = "outline";
                
                if (showResult) {
                  if (option === question.answer) {
                    variant = "success";
                  } else if (option === selectedAnswer && !isCorrect) {
                    variant = "destructive";
                  }
                }

                return (
                  <Button
                    key={option}
                    variant={variant}
                    className="w-full justify-start h-14 text-lg"
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showResult}
                  >
                    {option}
                    {showResult && option === question.answer && (
                      <Check className="w-5 h-5 ml-auto" />
                    )}
                    {showResult && option === selectedAnswer && !isCorrect && (
                      <X className="w-5 h-5 ml-auto" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Hint Button */}
          {!showResult && !showHint && (
            <Button
              variant="ghost"
              className="w-full mt-4 text-warning"
              onClick={() => setShowHint(true)}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Need a hint?
            </Button>
          )}

          {/* Hint Display */}
          {showHint && !showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-warning/10 border border-warning/30 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-foreground">{question.hint}</p>
              </div>
            </motion.div>
          )}

          {/* Explanation (after answering) */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 rounded-xl p-4 ${isCorrect ? "bg-success/10" : "bg-primary/10"}`}
            >
              <p className="text-foreground font-medium mb-2">
                {isCorrect ? "✅ Correct!" : "💡 Here's how it works:"}
              </p>
              <p className="text-muted-foreground">{question.explanation}</p>
            </motion.div>
          )}

          {/* Next Button */}
          {showResult && (
            <Button 
              variant="hero" 
              size="lg" 
              className="w-full mt-6"
              onClick={handleNext}
            >
              {currentQuestion < practiceQuestions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                "Finish Practice"
              )}
            </Button>
          )}
        </motion.div>
      </main>
    </div>
  );
}
