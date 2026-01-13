import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Trophy,
  Target,
  Play,
  CheckCircle,
  XCircle,
  Flame,
  Zap,
  GraduationCap,
  BarChart3,
  Award,
  ChevronRight,
  Loader2,
  Timer,
  Brain,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Confetti } from "@/components/Confetti";
import { 
  REGENTS_EXAMS, 
  REGENTS_QUESTIONS, 
  getQuestionsByExam,
  getRandomQuestionsForExam,
  type RegentsQuestion 
} from "@/data/regentsSampleQuestions";
import { NYS_STANDARDS, getStandardsBySubjectAndGrade } from "@/data/nysStandards";

interface ExamProgress {
  examType: string;
  questionsAttempted: number;
  correctAnswers: number;
  lastAttemptDate?: Date;
  bestScore: number;
}

interface StandardProgress {
  standardCode: string;
  questionsAttempted: number;
  correctAnswers: number;
  mastered: boolean;
}

export default function RegentsPrep() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("exams");
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [examProgress, setExamProgress] = useState<ExamProgress[]>([]);
  const [standardProgress, setStandardProgress] = useState<StandardProgress[]>([]);
  const [practiceMode, setPracticeMode] = useState<"exam" | "standard" | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<RegentsQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timedMode, setTimedMode] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    fetchProgress();
  }, []);

  // Timer effect
  useEffect(() => {
    if (!timedMode || practiceMode === null || showResult) return;

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
  }, [timedMode, practiceMode, showResult, currentIndex]);

  const fetchProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Simulate fetching progress from localStorage (in production, this would be from DB)
      const savedProgress = localStorage.getItem(`regents_progress_${user.id}`);
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        setExamProgress(parsed.exams || []);
        setStandardProgress(parsed.standards || []);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (newExamProgress: ExamProgress[], newStandardProgress: StandardProgress[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        localStorage.setItem(`regents_progress_${user.id}`, JSON.stringify({
          exams: newExamProgress,
          standards: newStandardProgress,
        }));
      }
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const handleTimeout = () => {
    setStreak(0);
    setShowResult(true);
    setShowExplanation(true);
  };

  const startPractice = (examType: string, timed: boolean, questionCount: number = 10) => {
    const questions = getRandomQuestionsForExam(examType, questionCount);
    if (questions.length === 0) {
      toast({
        title: "No questions available",
        description: "Questions for this exam are coming soon!",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentQuestions(questions);
    setSelectedExam(examType);
    setPracticeMode("exam");
    setCurrentIndex(0);
    setCorrectCount(0);
    setStreak(0);
    setMaxStreak(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowExplanation(false);
    setTimedMode(timed);
    setTimeLeft(timed ? 45 : 0); // 45 seconds per question in timed mode
    setStartTime(Date.now());
  };

  const handleAnswer = (answer: string) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    const isCorrect = answer === currentQuestions[currentIndex].correctAnswer;

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

    setShowResult(true);
    setShowExplanation(true);
  };

  const moveToNext = () => {
    if (currentIndex + 1 >= currentQuestions.length) {
      finishPractice();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(timedMode ? 45 : 0);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowExplanation(false);
    }
  };

  const finishPractice = () => {
    const percentage = Math.round((correctCount / currentQuestions.length) * 100);
    
    if (percentage >= 80) {
      setShowConfetti(true);
    }

    // Update progress
    const existingProgress = examProgress.find(p => p.examType === selectedExam);
    const newProgress: ExamProgress = {
      examType: selectedExam!,
      questionsAttempted: (existingProgress?.questionsAttempted || 0) + currentQuestions.length,
      correctAnswers: (existingProgress?.correctAnswers || 0) + correctCount,
      lastAttemptDate: new Date(),
      bestScore: Math.max(existingProgress?.bestScore || 0, percentage),
    };

    const updatedExamProgress = [
      ...examProgress.filter(p => p.examType !== selectedExam),
      newProgress,
    ];
    setExamProgress(updatedExamProgress);

    // Update standard progress
    const standardCounts = new Map<string, { attempted: number; correct: number }>();
    currentQuestions.forEach((q, idx) => {
      const wasCorrect = idx < correctCount; // Simplified - in real app would track per question
      const current = standardCounts.get(q.standardCode) || { attempted: 0, correct: 0 };
      standardCounts.set(q.standardCode, {
        attempted: current.attempted + 1,
        correct: current.correct + (wasCorrect ? 1 : 0),
      });
    });

    const updatedStandardProgress = [...standardProgress];
    standardCounts.forEach((counts, code) => {
      const existing = updatedStandardProgress.find(s => s.standardCode === code);
      if (existing) {
        existing.questionsAttempted += counts.attempted;
        existing.correctAnswers += counts.correct;
        existing.mastered = existing.correctAnswers / existing.questionsAttempted >= 0.8;
      } else {
        updatedStandardProgress.push({
          standardCode: code,
          questionsAttempted: counts.attempted,
          correctAnswers: counts.correct,
          mastered: counts.correct / counts.attempted >= 0.8,
        });
      }
    });
    setStandardProgress(updatedStandardProgress);

    saveProgress(updatedExamProgress, updatedStandardProgress);
    setPracticeMode(null);
    
    toast({
      title: percentage >= 70 ? "Great job! 🎉" : "Keep practicing!",
      description: `You scored ${percentage}% (${correctCount}/${currentQuestions.length})`,
    });
  };

  const exitPractice = () => {
    setPracticeMode(null);
    setSelectedExam(null);
    setCurrentQuestions([]);
  };

  const getExamProgress = (examType: string) => {
    return examProgress.find(p => p.examType === examType);
  };

  const getOverallStats = () => {
    const totalAttempted = examProgress.reduce((sum, p) => sum + p.questionsAttempted, 0);
    const totalCorrect = examProgress.reduce((sum, p) => sum + p.correctAnswers, 0);
    const mastered = standardProgress.filter(s => s.mastered).length;
    const totalStandards = standardProgress.length;
    
    return {
      totalAttempted,
      totalCorrect,
      accuracy: totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0,
      mastered,
      totalStandards,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Practice Mode View
  if (practiceMode && currentQuestions.length > 0) {
    const currentQuestion = currentQuestions[currentIndex];
    const progress = ((currentIndex) / currentQuestions.length) * 100;

    return (
      <div className="min-h-screen bg-background">
        {showConfetti && <Confetti active={showConfetti} />}
        
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={exitPractice}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="font-bold">
                    {REGENTS_EXAMS.find(e => e.id === selectedExam)?.name} Practice
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Question {currentIndex + 1}/{currentQuestions.length}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      {streak}
                    </span>
                  </div>
                </div>
              </div>
              
              {timedMode && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full font-mono",
                  timeLeft <= 10 ? "bg-red-100 text-red-600 dark:bg-red-900/30" : "bg-muted"
                )}>
                  <Timer className="w-4 h-4" />
                  <span className="font-bold">{timeLeft}s</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-2xl">
          {/* Progress */}
          <Progress value={progress} className="mb-6 h-2" />

          {/* Standard Tag */}
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="text-xs">
              {currentQuestion.standardCode}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {currentQuestion.difficulty === 1 ? "Easy" : currentQuestion.difficulty === 2 ? "Medium" : "Hard"}
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto">
              {currentQuestion.pointValue} points
            </span>
          </div>

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
                  <p className="text-lg font-medium">
                    {currentQuestion.prompt}
                  </p>
                </CardContent>
              </Card>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3 mb-6">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentQuestion.correctAnswer;
                  const showCorrectness = showResult;

                  return (
                    <motion.button
                      key={option}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
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

              {/* Explanation */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Card className="bg-muted/50 mb-6">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Brain className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium mb-1">Explanation</p>
                            <p className="text-sm text-muted-foreground">
                              {currentQuestion.explanation}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Next Button */}
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Button onClick={moveToNext} className="w-full" size="lg">
                    {currentIndex + 1 >= currentQuestions.length ? "Finish" : "Next Question"}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  // Main View
  const stats = getOverallStats();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/student")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-primary" />
                Regents Exam Prep
              </h1>
              <p className="text-sm text-muted-foreground">
                Practice for NY Regents Exams
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4 text-center">
              <Target className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalAttempted}</p>
              <p className="text-xs text-muted-foreground">Questions Attempted</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.accuracy}%</p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
            <CardContent className="p-4 text-center">
              <Award className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.mastered}</p>
              <p className="text-xs text-muted-foreground">Standards Mastered</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{examProgress.length}</p>
              <p className="text-xs text-muted-foreground">Exams Practiced</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="exams" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Exams
            </TabsTrigger>
            <TabsTrigger value="standards" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Standards
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Progress
            </TabsTrigger>
          </TabsList>

          {/* Exams Tab */}
          <TabsContent value="exams" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {REGENTS_EXAMS.map((exam, idx) => {
                const progress = getExamProgress(exam.id);
                const questionCount = getQuestionsByExam(exam.id).length;
                
                return (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{exam.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {exam.subject} • Grades {exam.gradeBand}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {questionCount} questions
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {progress && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Best Score</span>
                              <span className="font-semibold text-primary">{progress.bestScore}%</span>
                            </div>
                            <Progress value={progress.bestScore} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {progress.questionsAttempted} questions practiced
                            </p>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button 
                            className="flex-1"
                            onClick={() => startPractice(exam.id, false, 10)}
                            disabled={questionCount === 0}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Practice
                          </Button>
                          <Button 
                            variant="outline"
                            className="flex-1"
                            onClick={() => startPractice(exam.id, true, 10)}
                            disabled={questionCount === 0}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Timed
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Standards Tab */}
          <TabsContent value="standards" className="mt-6">
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {["Mathematics", "Science", "Social Studies", "English Language Arts"].map(subject => {
                  const standards = NYS_STANDARDS.filter(s => s.subject === subject);
                  const relatedProgress = standardProgress.filter(p => 
                    standards.some(s => s.code === p.standardCode)
                  );
                  const masteredCount = relatedProgress.filter(p => p.mastered).length;
                  
                  return (
                    <Card key={subject}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{subject}</CardTitle>
                          <Badge variant={masteredCount > 0 ? "default" : "secondary"}>
                            {masteredCount} mastered
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          {standards.slice(0, 5).map(standard => {
                            const sp = standardProgress.find(p => p.standardCode === standard.code);
                            return (
                              <div 
                                key={standard.code}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{standard.code}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {standard.standardText.slice(0, 50)}...
                                  </p>
                                </div>
                                {sp ? (
                                  <div className="flex items-center gap-2 ml-4">
                                    {sp.mastered ? (
                                      <CheckCircle className="w-5 h-5 text-green-500" />
                                    ) : (
                                      <span className="text-sm text-muted-foreground">
                                        {Math.round((sp.correctAnswers / sp.questionsAttempted) * 100)}%
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Not started</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="history" className="mt-6">
            <div className="space-y-4">
              {examProgress.length > 0 ? (
                examProgress.map((progress, idx) => {
                  const exam = REGENTS_EXAMS.find(e => e.id === progress.examType);
                  const accuracy = Math.round((progress.correctAnswers / progress.questionsAttempted) * 100);
                  
                  return (
                    <motion.div
                      key={progress.examType}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{exam?.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Last practiced: {progress.lastAttemptDate 
                                  ? new Date(progress.lastAttemptDate).toLocaleDateString()
                                  : "Never"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">{progress.bestScore}%</p>
                              <p className="text-xs text-muted-foreground">Best Score</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-muted/50 rounded-lg p-2">
                              <p className="text-lg font-semibold">{progress.questionsAttempted}</p>
                              <p className="text-xs text-muted-foreground">Attempted</p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-2">
                              <p className="text-lg font-semibold">{progress.correctAnswers}</p>
                              <p className="text-xs text-muted-foreground">Correct</p>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-2">
                              <p className="text-lg font-semibold">{accuracy}%</p>
                              <p className="text-xs text-muted-foreground">Accuracy</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Practice History Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start practicing to track your progress!
                    </p>
                    <Button onClick={() => setActiveTab("exams")}>
                      Start Practicing
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
