import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Target, TrendingUp, BookOpen, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface SubjectProgress {
  subject: string;
  mastered: number;
  approaching: number;
  developing: number;
  total: number;
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  "Mathematics": { bg: "bg-primary/10", text: "text-primary", icon: "🔢" },
  "English Language Arts": { bg: "bg-accent/10", text: "text-accent", icon: "📚" },
  "Science": { bg: "bg-success/10", text: "text-success", icon: "🔬" },
  "Social Studies": { bg: "bg-warning/10", text: "text-warning", icon: "🌍" },
};

export function StandardsMasteryWidget({ className }: { className?: string }) {
  const [subjects, setSubjects] = useState<SubjectProgress[]>([]);
  const [overallMastered, setOverallMastered] = useState(0);
  const [overallTotal, setOverallTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMasteryData();
  }, []);

  const fetchMasteryData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch student profile to get grade level
      const { data: studentProfile } = await supabase
        .from("student_profiles")
        .select("grade_level")
        .eq("user_id", user.id)
        .single();

      const gradeLevel = studentProfile?.grade_level || 9;
      const gradeBand = gradeLevel <= 8 ? "6-8" : "9-10";

      // Fetch all standards for the grade band
      const { data: standards } = await supabase
        .from("nys_standards")
        .select("id, subject")
        .eq("grade_band", gradeBand);

      if (!standards || standards.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch mastery data
      const { data: mastery } = await supabase
        .from("student_standard_mastery")
        .select("standard_id, mastery_level")
        .eq("student_id", user.id);

      const masteryMap = new Map(mastery?.map(m => [m.standard_id, m.mastery_level]) || []);

      // Group by subject
      const subjectMap: Record<string, SubjectProgress> = {};
      let totalMastered = 0;

      standards.forEach(standard => {
        if (!subjectMap[standard.subject]) {
          subjectMap[standard.subject] = {
            subject: standard.subject,
            mastered: 0,
            approaching: 0,
            developing: 0,
            total: 0,
          };
        }

        subjectMap[standard.subject].total++;
        const level = masteryMap.get(standard.id) || "not_started";
        
        if (level === "mastered") {
          subjectMap[standard.subject].mastered++;
          totalMastered++;
        } else if (level === "approaching") {
          subjectMap[standard.subject].approaching++;
        } else if (level === "developing") {
          subjectMap[standard.subject].developing++;
        }
      });

      setSubjects(Object.values(subjectMap));
      setOverallMastered(totalMastered);
      setOverallTotal(standards.length);
    } catch (error) {
      console.error("Error fetching mastery data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-card border border-border rounded-xl p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-2 bg-muted rounded" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-16 bg-muted rounded-lg" />
            <div className="h-16 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const overallPercent = overallTotal > 0 ? Math.round((overallMastered / overallTotal) * 100) : 0;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Standards Mastery</h2>
        </div>
        <Link to="/student/standards">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary h-8">
            Details
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        {/* Overall Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Overall Progress</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">{overallPercent}%</span>
            </div>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-success via-primary to-accent rounded-full"
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-muted-foreground">
              {overallMastered} of {overallTotal} standards mastered
            </span>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-success" />
                <span className="text-muted-foreground">Mastered</span>
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-primary" />
                <span className="text-muted-foreground">Approaching</span>
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3 text-warning" />
                <span className="text-muted-foreground">Developing</span>
              </span>
            </div>
          </div>
        </div>

        {/* Subject Breakdown */}
        {subjects.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {subjects.slice(0, 4).map((subject, idx) => {
              const colors = SUBJECT_COLORS[subject.subject] || { bg: "bg-muted", text: "text-muted-foreground", icon: "📖" };
              const percent = subject.total > 0 ? Math.round((subject.mastered / subject.total) * 100) : 0;
              
              return (
                <motion.div
                  key={subject.subject}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`${colors.bg} rounded-lg p-3 border border-transparent hover:border-border/50 transition-colors`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{colors.icon}</span>
                    <span className="text-xs font-medium text-foreground truncate">
                      {subject.subject === "English Language Arts" ? "ELA" : subject.subject}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className={`text-xl font-bold ${colors.text}`}>{percent}%</p>
                      <p className="text-[10px] text-muted-foreground">
                        {subject.mastered}/{subject.total}
                      </p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <MiniBar value={subject.mastered} max={subject.total} color="bg-success" />
                      <MiniBar value={subject.approaching} max={subject.total} color="bg-primary" />
                      <MiniBar value={subject.developing} max={subject.total} color="bg-warning" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <Circle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No standards data yet</p>
            <p className="text-xs text-muted-foreground/70">Complete assignments to track progress</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const width = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-12 h-1 bg-foreground/10 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${width}%` }} />
    </div>
  );
}
