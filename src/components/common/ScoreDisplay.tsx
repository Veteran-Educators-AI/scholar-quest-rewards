/**
 * ScoreDisplay Component
 *
 * Displays scores/grades with appropriate color coding and optional labels.
 * Supports various display formats (percentage, fraction, letter grade).
 */

import { cn } from "@/lib/utils";
import { Check, X, Minus, TrendingUp, TrendingDown } from "lucide-react";
import { getGradeColors, type GradeColorScheme } from "./tokens/colors";

// ============================================================================
// Types
// ============================================================================

export type ScoreFormat = "percentage" | "fraction" | "raw" | "letter";

export interface ScoreDisplayProps {
  /** The score value (0-100 for percentage, or raw number) */
  score: number;
  /** Maximum possible score (for fraction format) */
  maxScore?: number;
  /** Display format */
  format?: ScoreFormat;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Whether to show the grade label (Excellent, Good, etc.) */
  showLabel?: boolean;
  /** Whether to show a trend indicator */
  trend?: "up" | "down" | "neutral";
  /** Previous score for comparison */
  previousScore?: number;
  /** Whether to show pass/fail indicator */
  showPassFail?: boolean;
  /** Passing threshold (default 70) */
  passingThreshold?: number;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Size Configurations
// ============================================================================

const SIZE_CONFIGS = {
  sm: {
    score: "text-lg font-semibold",
    label: "text-xs",
    icon: "w-3 h-3",
    container: "gap-1",
  },
  md: {
    score: "text-2xl font-bold",
    label: "text-sm",
    icon: "w-4 h-4",
    container: "gap-1.5",
  },
  lg: {
    score: "text-4xl font-bold",
    label: "text-base",
    icon: "w-5 h-5",
    container: "gap-2",
  },
  xl: {
    score: "text-6xl font-bold",
    label: "text-lg",
    icon: "w-6 h-6",
    container: "gap-2.5",
  },
};

// ============================================================================
// Helpers
// ============================================================================

function getLetterGrade(score: number): string {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 63) return "D";
  if (score >= 60) return "D-";
  return "F";
}

function formatScore(
  score: number,
  format: ScoreFormat,
  maxScore?: number
): string {
  switch (format) {
    case "percentage":
      return `${Math.round(score)}%`;
    case "fraction":
      return maxScore ? `${score}/${maxScore}` : String(score);
    case "letter":
      return getLetterGrade(score);
    case "raw":
    default:
      return String(score);
  }
}

// ============================================================================
// Component
// ============================================================================

export function ScoreDisplay({
  score,
  maxScore,
  format = "percentage",
  size = "md",
  showLabel = false,
  trend,
  previousScore,
  showPassFail = false,
  passingThreshold = 70,
  className,
}: ScoreDisplayProps) {
  const sizeConfig = SIZE_CONFIGS[size];
  const gradeColors = getGradeColors(score);
  const isPassing = score >= passingThreshold;

  // Calculate trend if previousScore provided but trend not specified
  const effectiveTrend =
    trend ??
    (previousScore !== undefined
      ? score > previousScore
        ? "up"
        : score < previousScore
        ? "down"
        : "neutral"
      : undefined);

  const TrendIcon =
    effectiveTrend === "up"
      ? TrendingUp
      : effectiveTrend === "down"
      ? TrendingDown
      : Minus;

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center",
        sizeConfig.container,
        className
      )}
    >
      {/* Score with color */}
      <div className="flex items-center gap-2">
        <span className={cn(sizeConfig.score, gradeColors.text)}>
          {formatScore(score, format, maxScore)}
        </span>

        {/* Pass/Fail indicator */}
        {showPassFail && (
          <span
            className={cn(
              "rounded-full p-1",
              isPassing
                ? "bg-success/20 text-success"
                : "bg-destructive/20 text-destructive"
            )}
          >
            {isPassing ? (
              <Check className={sizeConfig.icon} />
            ) : (
              <X className={sizeConfig.icon} />
            )}
          </span>
        )}

        {/* Trend indicator */}
        {effectiveTrend && (
          <span
            className={cn(
              effectiveTrend === "up" && "text-success",
              effectiveTrend === "down" && "text-destructive",
              effectiveTrend === "neutral" && "text-muted-foreground"
            )}
          >
            <TrendIcon className={sizeConfig.icon} />
          </span>
        )}
      </div>

      {/* Grade label */}
      {showLabel && (
        <span className={cn(sizeConfig.label, gradeColors.text, "opacity-80")}>
          {gradeColors.label}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

export function PercentageScore({
  score,
  size = "md",
  showLabel = true,
  className,
}: {
  score: number;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <ScoreDisplay
      score={score}
      format="percentage"
      size={size}
      showLabel={showLabel}
      className={className}
    />
  );
}

export function QuizScore({
  correct,
  total,
  size = "md",
  showPassFail = true,
  className,
}: {
  correct: number;
  total: number;
  size?: "sm" | "md" | "lg" | "xl";
  showPassFail?: boolean;
  className?: string;
}) {
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <ScoreDisplay
        score={percentage}
        format="percentage"
        size={size}
        showPassFail={showPassFail}
      />
      <span className="text-sm text-muted-foreground">
        {correct} of {total} correct
      </span>
    </div>
  );
}

export function ComparisonScore({
  current,
  previous,
  size = "md",
  className,
}: {
  current: number;
  previous: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const diff = current - previous;
  const diffText = diff > 0 ? `+${diff}%` : `${diff}%`;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <ScoreDisplay
        score={current}
        format="percentage"
        size={size}
        previousScore={previous}
      />
      <span
        className={cn(
          "text-sm font-medium",
          diff > 0 && "text-success",
          diff < 0 && "text-destructive",
          diff === 0 && "text-muted-foreground"
        )}
      >
        {diff === 0 ? "No change" : diffText}
      </span>
    </div>
  );
}
