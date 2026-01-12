import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { Confetti } from "@/components/Confetti";
import { ArrowLeft, FileText, Clock, Star, Upload, Camera, HelpCircle, Loader2 } from "lucide-react";
import { useSyncToNYCologic } from "@/hooks/useSyncToNYCologic";
import { supabase } from "@/integrations/supabase/client";

// Demo data
const demoAssignment = {
  id: "1",
  title: "Math Magic: Multiplication",
  subject: "math",
  description: "Practice your multiplication tables from 1-10. Complete all problems to earn your reward!",
  dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
  xpReward: 50,
  coinReward: 10,
  printableUrl: "/demo-worksheet.pdf",
  hasInApp: true,
  estimatedTime: 15,
};

const demoQuestions = [
  { id: "1", prompt: "What is 7 × 8?", options: ["54", "56", "63", "64"], answer: "56", difficulty: 2 },
  { id: "2", prompt: "What is 9 × 6?", options: ["54", "56", "48", "63"], answer: "54", difficulty: 2 },
  { id: "3", prompt: "What is 12 × 4?", options: ["44", "46", "48", "52"], answer: "48", difficulty: 3 },
  { id: "4", prompt: "What is 8 × 8?", options: ["64", "72", "56", "81"], answer: "64", difficulty: 2 },
  { id: "5", prompt: "What is 11 × 7?", options: ["77", "74", "84", "88"], answer: "77", difficulty: 3 },
];

type Mode = "select" | "paper" | "in_app";
type QuizState = "intro" | "question" | "feedback" | "submitting" | "complete";

export default function AssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRetry = searchParams.get("retry") === "true";
  
  const [assignment] = useState(demoAssignment);
  const [mode, setMode] = useState<Mode>("select");
  const { syncAssignmentCompleted } = useSyncToNYCologic();
  
  // Quiz state
  const [quizState, setQuizState] = useState<QuizState>("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});

  // Paper mode state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    const correct = answer === demoQuestions[currentQuestion].answer;
    setIsCorrect(correct);
    if (correct) setScore((s) => s + 1);
    
    setUserAnswers((prev) => ({
      ...prev,
      [demoQuestions[currentQuestion].id]: answer,
    }));
    
    setQuizState("feedback");
  };

  const handleNext = () => {
    if (currentQuestion < demoQuestions.length - 1) {
      setCurrentQuestion((c) => c + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setQuizState("question");
    } else {
      // Submit to AI grader
      setQuizState("submitting");
      submitToAIGrader();
    }
  };

  const submitToAIGrader = async () => {
    // Simulate AI grading delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Navigate to grading result page
    navigate(`/student/grading?assignment=${id}&score=${score}&total=${demoQuestions.length}`);
  };

  const handlePaperSubmit = async () => {
    if (!uploadedFile) return;
    
    setIsUploading(true);
    // Simulate upload and AI grading
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Navigate to grading result
    navigate(`/student/grading?assignment=${id}&mode=paper`);
  };

  const formatTimeLeft = () => {
    const now = new Date();
    const diff = assignment.dueAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m left`;
  };

  if (mode === "in_app") {
    return (
      <div className="min-h-screen bg-background">
        <Confetti active={showConfetti} />
        
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (quizState === "intro") {
                    setMode("select");
                  } else if (quizState !== "submitting") {
                    if (confirm("Are you sure? Your progress will be lost.")) {
                      setMode("select");
                      setQuizState("intro");
                      setCurrentQuestion(0);
                      setScore(0);
                      setUserAnswers({});
                    }
                  }
                }}
                disabled={quizState === "submitting"}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="flex items-center gap-2">
                {(quizState === "question" || quizState === "feedback") && (
                  <>
                    <span className="text-sm font-medium text-muted-foreground">
                      {currentQuestion + 1} / {demoQuestions.length}
                    </span>
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentQuestion + 1) / demoQuestions.length) * 100}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/student/support?assignment=${id}`)}
                disabled={quizState === "submitting"}
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {quizState === "intro" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto text-center"
            >
              <ScholarBuddy size="lg" message={isRetry ? "Let's try again! You've got this!" : "Ready to show what you know? Let's do this!"} />
              
              <h1 className="text-2xl font-extrabold mt-6 mb-2">{assignment.title}</h1>
              <p className="text-muted-foreground mb-6">{demoQuestions.length} questions • ~{assignment.estimatedTime} min</p>
              
              <div className="bg-card rounded-2xl p-6 shadow-md border border-border mb-6">
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <Star className="w-8 h-8 text-gold mx-auto mb-1" />
                    <p className="font-bold text-gold">{assignment.xpReward} XP</p>
                  </div>
                  <div className="text-center">
                    <span className="text-3xl">🪙</span>
                    <p className="font-bold text-warning">{assignment.coinReward}</p>
                  </div>
                </div>
              </div>

              <Button variant="hero" size="xl" onClick={() => setQuizState("question")} className="w-full">
                {isRetry ? "Start Retry" : "Start Quiz"}
              </Button>
            </motion.div>
          )}

          {(quizState === "question" || quizState === "feedback") && (
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-lg mx-auto"
            >
              <div className="bg-card rounded-2xl p-6 shadow-lg border border-border mb-6">
                <h2 className="text-xl font-bold text-foreground mb-6">
                  {demoQuestions[currentQuestion].prompt}
                </h2>

                <div className="grid gap-3">
                  {demoQuestions[currentQuestion].options.map((option) => {
                    let buttonClass = "w-full justify-start h-14 text-lg";
                    let variant: "outline" | "success" | "destructive" = "outline";
                    
                    if (quizState === "feedback") {
                      if (option === demoQuestions[currentQuestion].answer) {
                        variant = "success";
                      } else if (option === selectedAnswer && !isCorrect) {
                        variant = "destructive";
                      }
                    }

                    return (
                      <Button
                        key={option}
                        variant={variant}
                        className={buttonClass}
                        onClick={() => quizState === "question" && handleAnswerSelect(option)}
                        disabled={quizState === "feedback"}
                      >
                        {option}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {quizState === "feedback" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-4 mb-6 ${isCorrect ? "bg-success/10" : "bg-destructive/10"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{isCorrect ? "🎉" : "💪"}</span>
                    <div>
                      <p className={`font-bold ${isCorrect ? "text-success" : "text-destructive"}`}>
                        {isCorrect ? "Great job!" : "Keep trying!"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isCorrect
                          ? "You got it right!"
                          : `The answer was ${demoQuestions[currentQuestion].answer}`}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {quizState === "feedback" && (
                <Button variant="hero" size="lg" onClick={handleNext} className="w-full">
                  {currentQuestion < demoQuestions.length - 1 ? "Next Question" : "Submit to AI Grader"}
                </Button>
              )}
            </motion.div>
          )}

          {quizState === "submitting" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-md mx-auto text-center"
            >
              <ScholarBuddy size="lg" message="Submitting your answers to the AI grader..." />
              <div className="mt-8 flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-lg font-medium text-muted-foreground">Processing...</span>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    );
  }

  if (mode === "paper") {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setMode("select")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/student/support?assignment=${id}`)}
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <ScholarBuddy size="md" message="Print your worksheet and submit a photo when done!" />
            
            <h1 className="text-2xl font-extrabold mt-6 mb-2">Paper Mode</h1>
            <p className="text-muted-foreground mb-8">{assignment.title}</p>

            <div className="space-y-4">
              <Button variant="outline" size="lg" className="w-full">
                <FileText className="w-5 h-5 mr-2" />
                Download Worksheet (PDF)
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    When complete
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  />
                  <Button variant="hero" size="lg" className="w-full" asChild>
                    <span>
                      <Camera className="w-5 h-5 mr-2" />
                      Take Photo of Work
                    </span>
                  </Button>
                </label>

                <label className="block">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  />
                  <Button variant="secondary" size="lg" className="w-full" asChild>
                    <span>
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Photo/PDF
                    </span>
                  </Button>
                </label>
              </div>

              {uploadedFile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-success/10 border border-success/30 rounded-xl p-4"
                >
                  <p className="text-success font-medium">✓ {uploadedFile.name}</p>
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full mt-4"
                    onClick={handlePaperSubmit}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting to AI Grader...
                      </>
                    ) : (
                      "Submit to AI Grader"
                    )}
                  </Button>
                </motion.div>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              📝 AI will grade your work and award your rewards!
            </p>
          </motion.div>
        </main>
      </div>
    );
  }

  // Mode selection view
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/student">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/student/support?assignment=${id}`)}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Assignment header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl shadow-glow-primary">
              🔢
            </div>
            <h1 className="text-2xl font-extrabold text-foreground mb-2">{assignment.title}</h1>
            <p className="text-muted-foreground">{assignment.description}</p>
          </div>

          {/* Time and rewards */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{formatTimeLeft()}</span>
            </div>
            <div className="flex items-center gap-2 bg-gold/10 px-4 py-2 rounded-full">
              <Star className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-gold">{assignment.xpReward} XP</span>
            </div>
          </div>

          {/* Mode selection */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-center text-foreground mb-4">
              How would you like to complete this?
            </h2>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode("paper")}
              className="w-full bg-card rounded-2xl p-6 border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-colors text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center text-2xl">
                  📄
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-lg">Do on Paper</h3>
                  <p className="text-sm text-muted-foreground">
                    Print the worksheet, complete it by hand, and submit a photo
                  </p>
                </div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode("in_app")}
              className="w-full bg-gradient-primary rounded-2xl p-6 shadow-glow-primary text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-primary-foreground/20 rounded-xl flex items-center justify-center text-2xl">
                  📱
                </div>
                <div className="flex-1 text-primary-foreground">
                  <h3 className="font-bold text-lg">Do in App</h3>
                  <p className="text-sm opacity-80">
                    Answer questions directly here with instant feedback
                  </p>
                  <p className="text-xs mt-2 bg-primary-foreground/20 px-2 py-1 rounded-full inline-block">
                    ⚡ Instant grading
                  </p>
                </div>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
