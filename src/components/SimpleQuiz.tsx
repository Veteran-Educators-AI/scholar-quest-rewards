import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { ArrowLeft, ArrowRight, Check, Send, Loader2, Star } from "lucide-react";
import { DragOrderQuestion } from "./quiz/DragOrderQuestion";
import { MatchingQuestion } from "./quiz/MatchingQuestion";
import { FillBlankQuestion } from "./quiz/FillBlankQuestion";

export interface QuizQuestion {
  id: string;
  prompt: string;
  question_type: "multiple_choice" | "short_answer" | "drag_order" | "matching" | "fill_blank";
  options?: string[];
  // For drag_order: ordered array of items (correct order)
  // For matching: array of {left, right} pairs
  // For fill_blank: sentence with _____ and array of correct answers
  answer_key: string | string[] | { left: string; right: string }[];
  // For fill_blank, this contains the sentence template
  fill_blank_sentence?: string;
  skill_tag?: string;
  difficulty?: number;
}

interface SimpleQuizProps {
  questions: QuizQuestion[];
  assignmentTitle: string;
  xpReward: number;
  coinReward: number;
  onComplete: (answers: Record<string, string>) => Promise<void>;
  onBack: () => void;
}

export function SimpleQuiz({
  questions,
  assignmentTitle,
  xpReward,
  coinReward,
  onComplete,
  onBack,
}: SimpleQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [shortAnswerInput, setShortAnswerInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const hasAnsweredCurrent = answers[currentQuestion?.id] !== undefined;

  const handleSelectAnswer = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  };

  const handleShortAnswerSubmit = () => {
    if (!shortAnswerInput.trim()) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: shortAnswerInput.trim(),
    }));
    setShortAnswerInput("");
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentIndex(prev => prev + 1);
      setShortAnswerInput("");
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      const prevQuestion = questions[currentIndex - 1];
      if (prevQuestion.question_type === "short_answer" && answers[prevQuestion.id]) {
        setShortAnswerInput(answers[prevQuestion.id]);
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(answers);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQuestionTypeIcon = (type: QuizQuestion["question_type"]) => {
    switch (type) {
      case "multiple_choice": return "🔘";
      case "short_answer": return "✏️";
      case "drag_order": return "↕️";
      case "matching": return "🔗";
      case "fill_blank": return "📝";
      default: return "❓";
    }
  };

  if (showIntro) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto text-center px-4 py-8"
      >
        <ScholarBuddy size="lg" message="Ready to show what you know? Let's do this!" />
        
        <h1 className="text-2xl font-extrabold mt-6 mb-2">{assignmentTitle}</h1>
        <p className="text-muted-foreground mb-4">
          {questions.length} questions • Quick and simple!
        </p>
        
        {/* Question type preview */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {Array.from(new Set(questions.map(q => q.question_type))).map(type => (
            <span key={type} className="px-3 py-1 bg-muted rounded-full text-xs font-medium">
              {getQuestionTypeIcon(type)} {type.replace("_", " ")}
            </span>
          ))}
        </div>
        
        <div className="bg-card rounded-2xl p-6 shadow-md border border-border mb-6">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <Star className="w-8 h-8 text-gold mx-auto mb-1" />
              <p className="font-bold text-gold">{xpReward} XP</p>
            </div>
            <div className="text-center">
              <span className="text-3xl">🪙</span>
              <p className="font-bold text-warning">{coinReward}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button variant="hero" size="xl" onClick={() => setShowIntro(false)} className="w-full">
            Start Quiz
          </Button>
          <Button variant="outline" size="lg" onClick={onBack} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with progress */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-lg">{getQuestionTypeIcon(currentQuestion.question_type)}</span>
              <span className="text-sm font-medium text-muted-foreground">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Question Card */}
            <div className="bg-card rounded-2xl p-6 shadow-lg border border-border mb-6">
              <div className="flex items-start gap-3 mb-6">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {currentIndex + 1}
                </span>
                <h2 className="text-lg font-bold text-foreground leading-snug">
                  {currentQuestion.prompt}
                </h2>
              </div>

              {/* Multiple Choice */}
              {currentQuestion.question_type === "multiple_choice" && currentQuestion.options && (
                <div className="grid gap-3">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = answers[currentQuestion.id] === option;
                    return (
                      <Button
                        key={idx}
                        variant={isSelected ? "default" : "outline"}
                        className={`w-full justify-start h-auto py-4 px-4 text-left ${
                          isSelected ? "ring-2 ring-primary ring-offset-2" : ""
                        }`}
                        onClick={() => handleSelectAnswer(option)}
                      >
                        <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 flex-shrink-0">
                          {isSelected && <Check className="w-4 h-4" />}
                        </span>
                        <span className="text-base">{option}</span>
                      </Button>
                    );
                  })}
                </div>
              )}

              {/* Short Answer */}
              {currentQuestion.question_type === "short_answer" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={shortAnswerInput}
                      onChange={(e) => setShortAnswerInput(e.target.value)}
                      placeholder="Type your answer..."
                      className="flex-1 h-12 text-base"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && shortAnswerInput.trim()) {
                          handleShortAnswerSubmit();
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      className="h-12 w-12"
                      onClick={handleShortAnswerSubmit}
                      disabled={!shortAnswerInput.trim()}
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                  {answers[currentQuestion.id] && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-primary/10 rounded-lg p-3 flex items-center gap-2"
                    >
                      <Check className="w-5 h-5 text-primary" />
                      <span className="font-medium">Your answer: {answers[currentQuestion.id]}</span>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Drag Order */}
              {currentQuestion.question_type === "drag_order" && currentQuestion.options && (
                <DragOrderQuestion
                  items={currentQuestion.options}
                  currentAnswer={answers[currentQuestion.id]}
                  onAnswer={(answer) => handleSelectAnswer(answer)}
                />
              )}

              {/* Matching */}
              {currentQuestion.question_type === "matching" && Array.isArray(currentQuestion.answer_key) && (
                <MatchingQuestion
                  pairs={currentQuestion.answer_key as { left: string; right: string }[]}
                  currentAnswer={answers[currentQuestion.id]}
                  onAnswer={(answer) => handleSelectAnswer(answer)}
                />
              )}

              {/* Fill in the Blank */}
              {currentQuestion.question_type === "fill_blank" && currentQuestion.fill_blank_sentence && (
                <FillBlankQuestion
                  sentence={currentQuestion.fill_blank_sentence}
                  currentAnswer={answers[currentQuestion.id]}
                  onAnswer={(answer) => handleSelectAnswer(answer)}
                />
              )}
            </div>

            {/* Skill tag */}
            {currentQuestion.skill_tag && (
              <p className="text-center text-sm text-muted-foreground mb-6">
                Topic: {currentQuestion.skill_tag}
              </p>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              {currentIndex > 0 && (
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={handlePrevious}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              <Button
                variant="hero"
                size="lg"
                className="flex-1"
                onClick={handleNext}
                disabled={!hasAnsweredCurrent || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : isLastQuestion ? (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Quiz
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
