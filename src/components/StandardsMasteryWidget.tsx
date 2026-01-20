/**
 * StandardsMasteryWidget Component
 *
 * Displays standards mastery progress by subject.
 * Refactored to use common design tokens and components.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Target, TrendingUp, BookOpen, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import {
  getSubjectColors,
  MASTERY_COLORS,
} from "@/components/common/tokens/colors";

// ============================================================================
// Types
// ============================================================================

interface SubjectProgress {
  subject: string;
  mastered: number;
  approaching: number;
  developing: number;
  total: number;
}

// ============================================================================
// Component
// ============================================================================

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

      const masteryMap = new Map(
        mastery?.map((m) => [m.standard_id, m.mastery_level]) || []
      );

      // Group by subject
      const subjectMap: Record<string, SubjectProgress> = {};
      let totalMastered = 0;

      standards.forEach((standard) => {
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
      <div className={cn("bg-card border border-border rounded-xl p-4", className)}>
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

  const overallPercent =
    overallTotal > 0 ? Math.round((overallMastered / overallTotal) * 100) : 0;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Standards Mastery
          </h2>
        </div>
        <Link to="/student/standards">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary h-8"
          >
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
            <span className="text-2xl font-bold text-foreground">
              {overallPercent}%
            </span>
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
            {/* Mastery level legend using design tokens */}
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <CheckCircle2 className={cn("w-3 h-3", MASTERY_COLORS.mastered.text)} />
                <span className="text-muted-foreground">Mastered</span>
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className={cn("w-3 h-3", MASTERY_COLORS.approaching.text)} />
                <span className="text-muted-foreground">Approaching</span>
              </span>
              <span className="flex items-center gap-1">
                <Target className={cn("w-3 h-3", MASTERY_COLORS.developing.text)} />
                <span className="text-muted-foreground">Developing</span>
              </span>
            </div>
          </div>
        </div>

        {/* Subject Breakdown */}
        {subjects.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {subjects.slice(0, 4).map((subject, idx) => {
              const colors = getSubjectColors(subject.subject);
              const percent =
                subject.total > 0
                  ? Math.round((subject.mastered / subject.total) * 100)
                  : 0;

              return (
                <motion.div
                  key={subject.subject}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    colors.bg,
                    "rounded-lg p-3 border border-transparent hover:border-border/50 transition-colors"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{colors.icon}</span>
                    <span className="text-xs font-medium text-foreground truncate">
                      {subject.subject === "English Language Arts"
                        ? "ELA"
                        : subject.subject}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className={cn("text-xl font-bold", colors.text)}>
                        {percent}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {subject.mastered}/{subject.total}
                      </p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <MiniBar
                        value={subject.mastered}
                        max={subject.total}
                        colorClass={MASTERY_COLORS.mastered.text.replace("text-", "bg-")}
                      />
                      <MiniBar
                        value={subject.approaching}
                        max={subject.total}
                        colorClass={MASTERY_COLORS.approaching.text.replace("text-", "bg-")}
                      />
                      <MiniBar
                        value={subject.developing}
                        max={subject.total}
                        colorClass={MASTERY_COLORS.developing.text.replace("text-", "bg-")}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            variant="data"
            title="No standards data yet"
            description="Complete assignments to track progress"
            size="sm"
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function MiniBar({
  value,
  max,
  colorClass,
}: {
  value: number;
  max: number;
  colorClass: string;
}) {
  const width = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-12 h-1 bg-foreground/10 rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full", colorClass)}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
