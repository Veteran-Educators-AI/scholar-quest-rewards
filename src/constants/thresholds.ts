/**
 * Score and Mastery Thresholds
 *
 * Centralized threshold values for grading, mastery, and progression.
 */

// ============================================================================
// Passing Thresholds
// ============================================================================

/** Minimum score percentage required to pass an assignment */
export const PASSING_SCORE = 70;

/** Minimum score percentage to earn practice set rewards */
export const PRACTICE_MINIMUM_SCORE = 60;

/** Mastery percentage required to unlock GeoBlox */
export const GEOBLOX_UNLOCK_THRESHOLD = 70;

// ============================================================================
// Grade Display Thresholds
// ============================================================================

/** Grade thresholds for color-coded display */
export const GRADE_THRESHOLDS = {
  EXCELLENT: 90,    // Green
  GOOD: 80,         // Blue
  SATISFACTORY: 70, // Yellow
  NEEDS_WORK: 65,   // Orange
  FAILING: 0,       // Red (below 65)
} as const;

/**
 * Get the display class for a grade value
 */
export function getGradeColorClass(grade: number | null | undefined): string {
  if (grade === null || grade === undefined) return "text-gray-400";
  if (grade >= GRADE_THRESHOLDS.EXCELLENT) return "text-green-600";
  if (grade >= GRADE_THRESHOLDS.GOOD) return "text-blue-600";
  if (grade >= GRADE_THRESHOLDS.SATISFACTORY) return "text-yellow-600";
  if (grade >= GRADE_THRESHOLDS.NEEDS_WORK) return "text-orange-600";
  return "text-red-600";
}

/**
 * Get the grade label for a score
 */
export function getGradeLabel(score: number | null | undefined): string {
  if (score === null || score === undefined) return "N/A";
  if (score >= GRADE_THRESHOLDS.EXCELLENT) return "Excellent";
  if (score >= GRADE_THRESHOLDS.GOOD) return "Good";
  if (score >= GRADE_THRESHOLDS.SATISFACTORY) return "Satisfactory";
  if (score >= GRADE_THRESHOLDS.NEEDS_WORK) return "Needs Improvement";
  return "Needs Work";
}

// ============================================================================
// Mastery Levels
// ============================================================================

export const MASTERY_LEVELS = {
  NOT_STARTED: 0,
  DEVELOPING: 25,
  APPROACHING: 50,
  PROFICIENT: 70,
  ADVANCED: 90,
} as const;

export type MasteryLevel = "not_started" | "developing" | "approaching" | "proficient" | "advanced";

export function getMasteryLevel(percentage: number): MasteryLevel {
  if (percentage >= MASTERY_LEVELS.ADVANCED) return "advanced";
  if (percentage >= MASTERY_LEVELS.PROFICIENT) return "proficient";
  if (percentage >= MASTERY_LEVELS.APPROACHING) return "approaching";
  if (percentage >= MASTERY_LEVELS.DEVELOPING) return "developing";
  return "not_started";
}
