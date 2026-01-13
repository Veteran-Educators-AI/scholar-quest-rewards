import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, BookOpen, Printer, Play, Clock, Target, 
  TrendingUp, AlertTriangle, CheckCircle2, Loader2,
  ChevronRight, Zap, Award, Brain
} from "lucide-react";
import { PoweredByFooter } from "@/components/PoweredByFooter";

interface PracticeSet {
  id: string;
  title: string;
  description: string | null;
  status: string;
  score: number | null;
  total_questions: number | null;
  skill_tags: string[] | null;
  printable_url: string | null;
  xp_reward: number;
  coin_reward: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface SkillGap {
  skill: string;
  attempts: number;
  correctRate: number;
  level: "weak" | "improving" | "strong";
}

export default function PracticeCenter() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [practiceSets, setPracticeSets] = useState<PracticeSet[]>([]);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);

  useEffect(() => {
    fetchPracticeData();
  }, []);

  const fetchPracticeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch practice sets
      const { data: sets, error: setsError } = await supabase
        .from("practice_sets")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (setsError) throw setsError;
      setPracticeSets(sets || []);

      // Fetch student weaknesses
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("weaknesses, skill_tags")
        .eq("user_id", user.id)
        .single();

      if (profile?.weaknesses) {
        setWeaknesses(profile.weaknesses);
      }

      // Calculate skill gaps from completed practice sets
      const completedSets = sets?.filter(s => s.status === "completed") || [];
      const skillMap = new Map<string, { correct: number; total: number }>();

      completedSets.forEach(set => {
        if (set.skill_tags) {
          set.skill_tags.forEach(skill => {
            const current = skillMap.get(skill) || { correct: 0, total: 0 };
            const scorePercent = set.score || 0;
            const questions = set.total_questions || 1;
            current.correct += Math.round((scorePercent / 100) * questions);
            current.total += questions;
            skillMap.set(skill, current);
          });
        }
      });

      const gaps: SkillGap[] = Array.from(skillMap.entries()).map(([skill, data]) => {
        const rate = data.total > 0 ? (data.correct / data.total) * 100 : 0;
        return {
          skill,
          attempts: data.total,
          correctRate: Math.round(rate),
          level: rate < 50 ? "weak" : rate < 80 ? "improving" : "strong",
        };
      });

      // Sort by weakest first
      gaps.sort((a, b) => a.correctRate - b.correctRate);
      setSkillGaps(gaps);

    } catch (error) {
      console.error("Error fetching practice data:", error);
      toast({
        title: "Error",
        description: "Failed to load practice data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = async (setId: string) => {
    try {
      // Update practice set to started
      await supabase
        .from("practice_sets")
        .update({ 
          status: "in_progress",
          started_at: new Date().toISOString()
        })
        .eq("id", setId);

      navigate(`/student/practice/${setId}`);
    } catch (error) {
      console.error("Error starting practice:", error);
      toast({
        title: "Error",
        description: "Failed to start practice",
        variant: "destructive",
      });
    }
  };

  const handlePrintWorksheet = (set: PracticeSet) => {
    if (set.printable_url) {
      window.open(set.printable_url, "_blank");
    } else {
      // Generate printable version
      navigate(`/student/practice/${set.id}/print`);
    }
  };

  const pendingSets = practiceSets.filter(s => s.status === "pending");
  const inProgressSets = practiceSets.filter(s => s.status === "in_progress");
  const completedSets = practiceSets.filter(s => s.status === "completed");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/student")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Practice Center</h1>
              <p className="text-sm text-muted-foreground">Strengthen your skills</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Skill Gaps Overview */}
        {(skillGaps.length > 0 || weaknesses.length > 0) && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-2xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Your Skill Progress</h2>
                  <p className="text-sm text-muted-foreground">Based on your practice history</p>
                </div>
              </div>

              {weaknesses.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Focus Areas:</p>
                  <div className="flex flex-wrap gap-2">
                    {weaknesses.map((weakness, idx) => (
                      <Badge key={idx} variant="outline" className="bg-warning/10 text-warning border-warning/30">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {weakness}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {skillGaps.length > 0 && (
                <div className="space-y-3">
                  {skillGaps.slice(0, 5).map((gap, idx) => (
                    <div key={idx} className="bg-card/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{gap.skill}</span>
                        <Badge 
                          variant="outline" 
                          className={
                            gap.level === "weak" ? "bg-destructive/10 text-destructive border-destructive/30" :
                            gap.level === "improving" ? "bg-warning/10 text-warning border-warning/30" :
                            "bg-success/10 text-success border-success/30"
                          }
                        >
                          {gap.correctRate}% correct
                        </Badge>
                      </div>
                      <Progress 
                        value={gap.correctRate} 
                        className={`h-2 ${
                          gap.level === "weak" ? "[&>div]:bg-destructive" :
                          gap.level === "improving" ? "[&>div]:bg-warning" :
                          "[&>div]:bg-success"
                        }`}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {gap.attempts} questions attempted
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {skillGaps.length === 0 && weaknesses.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Complete more practice sets to see your skill progress!
                </p>
              )}
            </div>
          </motion.section>
        )}

        {/* Practice Sets Tabs */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="pending" className="relative">
                New
                {pendingSets.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {pendingSets.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                In Progress
                {inProgressSets.length > 0 && (
                  <span className="ml-2 text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full">
                    {inProgressSets.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-3">
              {pendingSets.length === 0 ? (
                <EmptyState 
                  icon={<BookOpen className="w-8 h-8" />}
                  title="No new practice sets"
                  description="Check back after completing assignments for personalized practice"
                />
              ) : (
                pendingSets.map((set, idx) => (
                  <PracticeSetCard
                    key={set.id}
                    set={set}
                    index={idx}
                    onStart={() => handleStartPractice(set.id)}
                    onPrint={() => handlePrintWorksheet(set)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="in_progress" className="space-y-3">
              {inProgressSets.length === 0 ? (
                <EmptyState 
                  icon={<Play className="w-8 h-8" />}
                  title="No practice in progress"
                  description="Start a practice set to continue here"
                />
              ) : (
                inProgressSets.map((set, idx) => (
                  <PracticeSetCard
                    key={set.id}
                    set={set}
                    index={idx}
                    onStart={() => navigate(`/student/practice/${set.id}`)}
                    onPrint={() => handlePrintWorksheet(set)}
                    showContinue
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-3">
              {completedSets.length === 0 ? (
                <EmptyState 
                  icon={<CheckCircle2 className="w-8 h-8" />}
                  title="No completed practice"
                  description="Complete practice sets to see your results here"
                />
              ) : (
                completedSets.map((set, idx) => (
                  <CompletedSetCard key={set.id} set={set} index={idx} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </motion.section>
      </main>

      <PoweredByFooter />
    </div>
  );
}

function PracticeSetCard({ 
  set, 
  index, 
  onStart, 
  onPrint,
  showContinue = false 
}: { 
  set: PracticeSet; 
  index: number;
  onStart: () => void;
  onPrint: () => void;
  showContinue?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">{set.title}</h3>
          {set.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{set.description}</p>
          )}
          
          <div className="flex flex-wrap gap-2 mb-3">
            {set.skill_tags?.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {(set.skill_tags?.length || 0) > 3 && (
              <Badge variant="outline" className="text-xs">
                +{set.skill_tags!.length - 3} more
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              {set.total_questions || "?"} questions
            </span>
            <span className="flex items-center gap-1 text-primary">
              <Zap className="w-4 h-4" />
              +{set.xp_reward} XP
            </span>
            <span className="flex items-center gap-1 text-gold">
              <Award className="w-4 h-4" />
              +{set.coin_reward} coins
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button 
          variant="default" 
          className="flex-1"
          onClick={onStart}
        >
          <Play className="w-4 h-4 mr-2" />
          {showContinue ? "Continue" : "Start In-App"}
        </Button>
        <Button 
          variant="outline"
          onClick={onPrint}
        >
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
      </div>
    </motion.div>
  );
}

function CompletedSetCard({ set, index }: { set: PracticeSet; index: number }) {
  const score = set.score || 0;
  const scoreColor = score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card border border-border rounded-xl p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">{set.title}</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {set.skill_tags?.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {set.completed_at ? new Date(set.completed_at).toLocaleDateString() : "N/A"}
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              {set.total_questions} questions
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-2xl font-bold ${scoreColor}`}>
            {score}%
          </div>
          <p className="text-xs text-muted-foreground">Score</p>
        </div>
      </div>

      <div className="mt-3">
        <Progress 
          value={score} 
          className={`h-2 ${
            score >= 80 ? "[&>div]:bg-success" :
            score >= 60 ? "[&>div]:bg-warning" :
            "[&>div]:bg-destructive"
          }`}
        />
      </div>
    </motion.div>
  );
}

function EmptyState({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-8 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
