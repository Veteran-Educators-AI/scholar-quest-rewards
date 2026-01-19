/**
 * StandardsMasteryTracker Component
 *
 * Detailed standards mastery view with subject breakdown.
 * Refactored to use common design tokens.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Target, TrendingUp, BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  getSubjectColors,
  MASTERY_COLORS,
  type MasteryLevel,
} from "@/components/common/tokens/colors";

// ============================================================================
// Types
// ============================================================================

interface StandardMastery {
  id: string;
  standard_id: string;
  attempts_count: number;
  correct_count: number;
  mastery_level: string;
  last_attempt_at: string | null;
  mastered_at: string | null;
  standard?: {
    code: string;
    subject: string;
    grade_band: string;
    domain: string;
    standard_text: string;
  };
}

interface StandardsMasteryTrackerProps {
  studentId?: string;
  gradeBand?: string;
  className?: string;
}

// ============================================================================
// Mastery Level Icons
// ============================================================================

const MASTERY_ICONS = {
  not_started: Circle,
  developing: Target,
  approaching: TrendingUp,
  mastered: CheckCircle2,
} as const;

// ============================================================================
// Component
// ============================================================================

export function StandardsMasteryTracker({
  studentId,
  gradeBand = "9-10",
  className,
}: StandardsMasteryTrackerProps) {
  const [masteryData, setMasteryData] = useState<StandardMastery[]>([]);
  const [allStandards, setAllStandards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [studentId, gradeBand]);

  const fetchData = async () => {
    try {
      const { data: standards } = await supabase
        .from("nys_standards")
        .select("*")
        .eq("grade_band", gradeBand);

      setAllStandards(standards || []);

      if (studentId) {
        const { data: mastery } = await supabase
          .from("student_standard_mastery")
          .select(`
            *,
            standard:nys_standards(code, subject, grade_band, domain, standard_text)
          `)
          .eq("student_id", studentId);

        setMasteryData(mastery || []);
      }
    } catch (error) {
      console.error("Error fetching mastery data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group standards by subject
  const standardsBySubject = allStandards.reduce(
    (acc: Record<string, any[]>, standard: any) => {
      if (!acc[standard.subject]) {
        acc[standard.subject] = [];
      }
      acc[standard.subject].push(standard);
      return acc;
    },
    {} as Record<string, any[]>
  );

  const getMasteryForStandard = (standardId: string) => {
    return masteryData.find((m) => m.standard_id === standardId);
  };

  const calculateSubjectStats = (standards: any[]) => {
    let mastered = 0;
    let approaching = 0;
    let developing = 0;
    let notStarted = 0;

    standards.forEach((standard) => {
      const mastery = getMasteryForStandard(standard.id);
      if (!mastery || mastery.mastery_level === "not_started") notStarted++;
      else if (mastery.mastery_level === "developing") developing++;
      else if (mastery.mastery_level === "approaching") approaching++;
      else if (mastery.mastery_level === "mastered") mastered++;
    });

    return { mastered, approaching, developing, notStarted, total: standards.length };
  };

  const overallStats = {
    mastered: masteryData.filter((m) => m.mastery_level === "mastered").length,
    approaching: masteryData.filter((m) => m.mastery_level === "approaching").length,
    developing: masteryData.filter((m) => m.mastery_level === "developing").length,
    total: allStandards.length,
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-muted rounded-xl" />
        <div className="h-32 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Overall Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            NYS Standards Progress
          </h3>
          <Badge variant="outline" className="font-mono">
            Grades {gradeBand}
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <StatBox label="Mastered" value={overallStats.mastered} level="mastered" />
          <StatBox label="Approaching" value={overallStats.approaching} level="approaching" />
          <StatBox label="Developing" value={overallStats.developing} level="developing" />
          <StatBox
            label="Not Started"
            value={
              overallStats.total -
              overallStats.mastered -
              overallStats.approaching -
              overallStats.developing
            }
            level="not_started"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Mastery</span>
            <span className="font-medium">
              {overallStats.total > 0
                ? Math.round((overallStats.mastered / overallStats.total) * 100)
                : 0}
              %
            </span>
          </div>
          <Progress
            value={
              overallStats.total > 0
                ? (overallStats.mastered / overallStats.total) * 100
                : 0
            }
            className="h-3"
          />
        </div>
      </motion.div>

      {/* Standards by Subject */}
      <Accordion type="multiple" className="space-y-3">
        {Object.entries(standardsBySubject).map(([subject, standards], index) => {
          const standardsArray = standards as any[];
          const stats = calculateSubjectStats(standardsArray);
          const progressPercent =
            stats.total > 0 ? (stats.mastered / stats.total) * 100 : 0;
          const subjectColors = getSubjectColors(subject);

          return (
            <motion.div
              key={subject}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <AccordionItem
                value={subject}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-xl",
                          subjectColors.bg
                        )}
                      >
                        {subjectColors.icon}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-foreground">{subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {stats.mastered} of {stats.total} standards mastered
                        </p>
                      </div>
                    </div>
                    <div className="w-24">
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2 pt-2">
                    {standardsArray.map((standard: any) => {
                      const mastery = getMasteryForStandard(standard.id);
                      const level = (mastery?.mastery_level || "not_started") as MasteryLevel;
                      const levelColors = MASTERY_COLORS[level];
                      const Icon = MASTERY_ICONS[level];

                      return (
                        <div
                          key={standard.id}
                          className={cn(
                            "p-3 rounded-lg border border-transparent",
                            levelColors.bg
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={cn("w-5 h-5 mt-0.5", levelColors.text)} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {standard.code}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className={cn("text-xs", levelColors.text)}
                                >
                                  {levelColors.label}
                                </Badge>
                                {mastery && mastery.attempts_count > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {mastery.correct_count}/{mastery.attempts_count} correct
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {standard.standard_text}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          );
        })}
      </Accordion>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function StatBox({
  label,
  value,
  level,
}: {
  label: string;
  value: number;
  level: MasteryLevel;
}) {
  const colors = MASTERY_COLORS[level];

  return (
    <div className={cn("rounded-xl p-3 text-center", colors.bg)}>
      <p className={cn("text-2xl font-bold", colors.text)}>{value}</p>
      <p className={cn("text-xs", colors.text)}>{label}</p>
    </div>
  );
}
