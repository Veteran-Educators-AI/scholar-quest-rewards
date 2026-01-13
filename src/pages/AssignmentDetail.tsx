import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScholarBuddy } from "@/components/ScholarBuddy";
import { Confetti } from "@/components/Confetti";
import { SimpleQuiz, QuizQuestion } from "@/components/SimpleQuiz";
import { ArrowLeft, FileText, Clock, Star, Upload, Camera, HelpCircle, Loader2 } from "lucide-react";
import { useGradeAssignment } from "@/hooks/useGradeAssignment";
import { supabase } from "@/integrations/supabase/client";

// Demo assignment data
const demoAssignment = {
  id: "1",
  title: "Math Magic: Multiplication & More",
  subject: "math",
  description: "Practice multiplication with different question types! Multiple choice, short answer, ordering, matching, and fill-in-the-blank.",
  dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
  xpReward: 80,
  coinReward: 16,
  printableUrl: "/demo-worksheet.pdf",
  hasInApp: true,
  estimatedTime: 10,
};

// Demo questions - mix of ALL question types (8 questions)
const demoQuestions: QuizQuestion[] = [
  // Multiple Choice
  { 
    id: "1", 
    prompt: "What is 7 × 8?", 
    question_type: "multiple_choice", 
    options: ["54", "56", "63", "64"], 
    answer_key: "56", 
    skill_tag: "Multiplication", 
    difficulty: 2 
  },
  { 
    id: "2", 
    prompt: "What is 9 × 6?", 
    question_type: "multiple_choice", 
    options: ["54", "56", "48", "63"], 
    answer_key: "54", 
    skill_tag: "Multiplication", 
    difficulty: 2 
  },
  // Short Answer
  { 
    id: "3", 
    prompt: "If you have 5 bags with 7 apples each, how many apples do you have in total?", 
    question_type: "short_answer", 
    answer_key: ["35", "thirty-five", "thirty five"], 
    skill_tag: "Word Problems", 
    difficulty: 3 
  },
  // Drag Order - put numbers in order
  { 
    id: "4", 
    prompt: "Put these multiplication results in order from SMALLEST to LARGEST:", 
    question_type: "drag_order", 
    options: ["3×4=12", "5×5=25", "2×3=6", "4×4=16"],
    answer_key: ["2×3=6", "3×4=12", "4×4=16", "5×5=25"], 
    skill_tag: "Number Sense", 
    difficulty: 2 
  },
  // Matching - match multiplication to answer
  { 
    id: "5", 
    prompt: "Match each multiplication problem to its correct answer:", 
    question_type: "matching", 
    answer_key: [
      { left: "6 × 6", right: "36" },
      { left: "7 × 7", right: "49" },
      { left: "8 × 8", right: "64" },
      { left: "9 × 9", right: "81" }
    ],
    skill_tag: "Perfect Squares", 
    difficulty: 2 
  },
  // Fill in the Blank
  { 
    id: "6", 
    prompt: "Complete the multiplication sentence:", 
    question_type: "fill_blank",
    fill_blank_sentence: "If 4 × 5 = 20, then 4 × _____ = 40 and 4 × _____ = 60.",
    answer_key: ["10", "15"], 
    skill_tag: "Patterns", 
    difficulty: 3 
  },
  // Another Multiple Choice
  { 
    id: "7", 
    prompt: "What is 12 × 12?", 
    question_type: "multiple_choice", 
    options: ["124", "132", "144", "156"], 
    answer_key: "144", 
    skill_tag: "Perfect Squares", 
    difficulty: 3 
  },
  // Another Drag Order
  { 
    id: "8", 
    prompt: "Put these steps in order to solve 15 × 4:", 
    question_type: "drag_order", 
    options: ["Write the answer: 60", "Multiply: 10×4=40, 5×4=20", "Break 15 into 10+5", "Add: 40+20=60"],
    answer_key: ["Break 15 into 10+5", "Multiply: 10×4=40, 5×4=20", "Add: 40+20=60", "Write the answer: 60"], 
    skill_tag: "Problem Solving", 
    difficulty: 3 
  },
];

type Mode = "select" | "paper" | "in_app";

export default function AssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRetry = searchParams.get("retry") === "true";
  
  const [assignment] = useState(demoAssignment);
  const [mode, setMode] = useState<Mode>("select");
  const { gradeAssignment, isGrading } = useGradeAssignment();

  // Paper mode state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleQuizComplete = async (answers: Record<string, string>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // For demo, navigate with mock data
        navigate(`/student/grading?assignment=${id}&score=4&total=6`);
        return;
      }

      // Grade the assignment using the edge function
      const result = await gradeAssignment({
        studentId: user.id,
        assignmentId: id || "demo",
        answers,
        questions: demoQuestions,
      });

      if (result) {
        // Navigate to grading result with the actual data
        navigate(`/student/grading?assignment=${id}&score=${result.score}&total=${result.total_questions}&xp=${result.xp_earned}&coins=${result.coins_earned}`);
      } else {
        // Fallback navigation
        navigate(`/student/grading?assignment=${id}&score=4&total=6`);
      }
    } catch (error) {
      console.error("Quiz completion error:", error);
      navigate(`/student/grading?assignment=${id}&score=4&total=6`);
    }
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

  // Use the SimpleQuiz component for in_app mode
  if (mode === "in_app") {
    return (
      <SimpleQuiz
        questions={demoQuestions}
        assignmentTitle={assignment.title}
        xpReward={assignment.xpReward}
        coinReward={assignment.coinReward}
        onComplete={handleQuizComplete}
        onBack={() => setMode("select")}
      />
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
