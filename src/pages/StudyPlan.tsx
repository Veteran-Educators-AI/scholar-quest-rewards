import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Target,
  Trophy,
  Flame,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Loader2,
  ChevronRight,
  GraduationCap,
  Brain,
  Star,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Confetti } from "@/components/Confetti";
import { useCelebrationSound } from "@/hooks/useCelebrationSound";

interface PriorityArea {
  standardCode: string;
  subject: string;
  topic: string;
  reason: string;
  currentLevel: "not_started" | "developing" | "approaching" | "mastered";
  urgency: "high" | "medium" | "low";
  suggestedTime: string;
}

interface WeeklyGoal {
  goal: string;
  metric: string;
  relatedStandard?: string;
  completed?: boolean;
}

interface DailyActivity {
  day: string;
  focusArea: string;
  activities: string[];
  estimatedTime: string;
}

interface StudyPlanData {
  summary: string;
  priorityAreas: PriorityArea[];
  weeklyGoals: WeeklyGoal[];
  dailySchedule: DailyActivity[];
  encouragement: string;
}

export default function StudyPlan() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { celebrate } = useCelebrationSound();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyPlanData | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [completedGoals, setCompletedGoals] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState("priorities");
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    loadCachedPlan();
  }, []);

  const loadCachedPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Load cached plan from localStorage
      const cached = localStorage.getItem(`study_plan_${user.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setStudyPlan(parsed.studyPlan);
        setGeneratedAt(parsed.generatedAt);
        
        // Load completed goals
        const completedKey = `study_goals_completed_${user.id}`;
        const savedCompleted = localStorage.getItem(completedKey);
        if (savedCompleted) {
          setCompletedGoals(new Set(JSON.parse(savedCompleted)));
        }
      }
    } catch (error) {
      console.error("Error loading cached plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewPlan = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-study-plan");

      if (error) {
        throw error;
      }

      if (data.error) {
        if (data.error.includes("Rate limit")) {
          toast({
            title: "Please wait",
            description: "Too many requests. Try again in a minute.",
            variant: "destructive",
          });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setStudyPlan(data.studyPlan);
      setGeneratedAt(data.generatedAt);
      setCompletedGoals(new Set());

      // Cache the plan
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        localStorage.setItem(`study_plan_${user.id}`, JSON.stringify({
          studyPlan: data.studyPlan,
          generatedAt: data.generatedAt,
        }));
        localStorage.removeItem(`study_goals_completed_${user.id}`);
      }

      toast({
        title: "Study plan generated! 📚",
        description: "Your personalized plan is ready.",
      });
    } catch (error) {
      console.error("Error generating plan:", error);
      toast({
        title: "Failed to generate plan",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const toggleGoalComplete = async (index: number) => {
    const wasCompleted = completedGoals.has(index);
    const newCompleted = new Set(completedGoals);
    
    if (wasCompleted) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedGoals(newCompleted);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Save to localStorage
    localStorage.setItem(
      `study_goals_completed_${user.id}`,
      JSON.stringify([...newCompleted])
    );

    // Study goal completion is tracked locally - no XP/coin rewards for self-reported goals
    // This prevents manipulation. Rewards are only given for verified activities like
    // completing practice sets, games, and graded assignments.
    if (!wasCompleted) {
      toast({
        title: "Goal marked complete! ✓",
        description: "Keep up the great work on your study plan!",
      });

      // Check if all goals completed for encouragement
      if (newCompleted.size === studyPlan?.weeklyGoals.length) {
        setShowConfetti(true);
        celebrate();
        setTimeout(() => setShowConfetti(false), 4000);

        toast({
          title: "All goals completed! 🏆",
          description: "Amazing dedication! Complete practice sets to earn rewards.",
        });
      }
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "medium": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "low": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "mastered": return "text-green-600";
      case "approaching": return "text-blue-600";
      case "developing": return "text-amber-600";
      case "not_started": return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  const getLevelProgress = (level: string) => {
    switch (level) {
      case "mastered": return 100;
      case "approaching": return 75;
      case "developing": return 40;
      case "not_started": return 10;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Confetti active={showConfetti} duration={4000} />
      <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/student")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  AI Study Plan
                </h1>
                {generatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Generated {new Date(generatedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <Button 
              onClick={generateNewPlan} 
              disabled={generating}
              variant={studyPlan ? "outline" : "default"}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {studyPlan ? "Refresh" : "Generate Plan"}
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {!studyPlan ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Create Your Study Plan</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Our AI will analyze your performance, identify areas for improvement, 
              and create a personalized study plan tailored to your upcoming exams.
            </p>
            <Button size="lg" onClick={generateNewPlan} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing your progress...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate My Plan
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Your Study Summary</h3>
                      <p className="text-muted-foreground">{studyPlan.summary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Weekly Goals Progress */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Weekly Goals
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {completedGoals.size}/{studyPlan.weeklyGoals.length} completed
                    </span>
                  </div>
                  <Progress 
                    value={(completedGoals.size / studyPlan.weeklyGoals.length) * 100} 
                    className="h-2 mt-2"
                  />
                </CardHeader>
                <CardContent className="space-y-3">
                  {studyPlan.weeklyGoals.map((goal, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + idx * 0.05 }}
                      onClick={() => toggleGoalComplete(idx)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left",
                        completedGoals.has(idx) 
                          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                          : "bg-card border-border hover:border-primary/30"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        completedGoals.has(idx)
                          ? "bg-green-500 text-white"
                          : "border-2 border-muted-foreground/30"
                      )}>
                        {completedGoals.has(idx) && <CheckCircle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className={cn(
                          "font-medium",
                          completedGoals.has(idx) && "line-through text-muted-foreground"
                        )}>
                          {goal.goal}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">{goal.metric}</p>
                        {goal.relatedStandard && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {goal.relatedStandard}
                          </Badge>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="priorities" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Focus Areas
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Daily Plan
                </TabsTrigger>
              </TabsList>

              {/* Priority Areas */}
              <TabsContent value="priorities" className="mt-6 space-y-4">
                {studyPlan.priorityAreas.map((area, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={getUrgencyColor(area.urgency)}>
                              {area.urgency === "high" && <Flame className="w-3 h-3 mr-1" />}
                              {area.urgency.charAt(0).toUpperCase() + area.urgency.slice(1)} Priority
                            </Badge>
                            <Badge variant="outline">{area.subject}</Badge>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {area.suggestedTime}
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-1">{area.topic}</h3>
                        <p className="text-sm text-primary font-mono mb-2">{area.standardCode}</p>
                        <p className="text-sm text-muted-foreground mb-3">{area.reason}</p>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Current Level</span>
                              <span className={getLevelColor(area.currentLevel)}>
                                {area.currentLevel.replace("_", " ").charAt(0).toUpperCase() + 
                                 area.currentLevel.replace("_", " ").slice(1)}
                              </span>
                            </div>
                            <Progress 
                              value={getLevelProgress(area.currentLevel)} 
                              className="h-2"
                            />
                          </div>
                          <Link to="/regents-prep">
                            <Button size="sm">
                              Practice
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </TabsContent>

              {/* Daily Schedule */}
              <TabsContent value="schedule" className="mt-6 space-y-4">
                {studyPlan.dailySchedule.map((day, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={cn(
                      idx === 0 && "border-primary/50 bg-primary/5"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              idx === 0 
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}>
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{day.day}</h3>
                              <p className="text-sm text-muted-foreground">{day.focusArea}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {day.estimatedTime}
                          </Badge>
                        </div>
                        
                        <ul className="space-y-2">
                          {day.activities.map((activity, actIdx) => (
                            <li 
                              key={actIdx}
                              className="flex items-start gap-2 text-sm"
                            >
                              <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{activity}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </TabsContent>
            </Tabs>

            {/* Encouragement */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                      <Star className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-amber-900 dark:text-amber-100">
                        You've Got This! 💪
                      </h3>
                      <p className="text-amber-800 dark:text-amber-200">
                        {studyPlan.encouragement}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </main>
      </div>
    </>
  );
}
