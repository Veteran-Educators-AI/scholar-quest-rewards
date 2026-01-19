/**
 * Centralized constants for edge functions.
 * Eliminates magic numbers scattered across functions.
 *
 * All values are `as const` for compile-time type narrowing.
 */

/**
 * Score thresholds for various operations.
 */
export const THRESHOLDS = {
  /** Minimum passing score for assignments (70%) */
  PASSING_SCORE: 70,

  /** Minimum score for practice set rewards (60%) */
  PRACTICE_MINIMUM: 60,

  /** Minimum score for game rewards (70%) */
  GAME_MINIMUM: 70,

  /** Score required to unlock GeoBlox (70%) */
  GEOBLOX_UNLOCK: 70,
} as const;

/**
 * Base reward amounts for various activities.
 */
export const REWARDS = {
  /** Base XP per correct answer in assignments */
  BASE_XP_PER_CORRECT: 10,

  /** Base coins per correct answer in assignments */
  BASE_COIN_PER_CORRECT: 2,

  /** Default XP reward for practice sets */
  PRACTICE_SET_XP: 25,

  /** Default coin reward for practice sets */
  PRACTICE_SET_COINS: 10,

  /** Default XP reward for games */
  GAME_XP: 30,

  /** Default coin reward for games */
  GAME_COINS: 15,

  /** Maximum XP for study goals */
  STUDY_GOAL_MAX_XP: 25,

  /** Maximum coins for study goals */
  STUDY_GOAL_MAX_COINS: 10,
} as const;

/**
 * Validation limits for request payloads.
 */
export const LIMITS = {
  /** Maximum XP that can be awarded in a single request */
  MAX_XP_PER_REQUEST: 1000,

  /** Maximum coins that can be awarded in a single request */
  MAX_COINS_PER_REQUEST: 500,

  /** Maximum length for reason/description fields */
  MAX_REASON_LENGTH: 500,

  /** Maximum questions per assignment */
  MAX_QUESTIONS_PER_ASSIGNMENT: 100,

  /** Maximum options per multiple choice question */
  MAX_OPTIONS_PER_QUESTION: 10,
} as const;

/**
 * Claim types for reward system.
 */
export const CLAIM_TYPES = {
  PRACTICE_SET: "practice_set",
  GAME: "game",
  STUDY_GOAL: "study_goal",
  ASSIGNMENT: "assignment",
  CHALLENGE: "challenge",
} as const;

export type ClaimType = (typeof CLAIM_TYPES)[keyof typeof CLAIM_TYPES];

/**
 * Question types supported by the system.
 */
export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: "multiple_choice",
  SHORT_ANSWER: "short_answer",
  DRAG_ORDER: "drag_order",
  MATCHING: "matching",
  FILL_BLANK: "fill_blank",
} as const;

export type QuestionType = (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];

/**
 * Mastery levels for student progress tracking.
 */
export const MASTERY_LEVELS = {
  NOT_STARTED: "not_started",
  DEVELOPING: "developing",
  APPROACHING: "approaching",
  MASTERED: "mastered",
} as const;

export type MasteryLevel = (typeof MASTERY_LEVELS)[keyof typeof MASTERY_LEVELS];

/**
 * XP required per level.
 */
export const XP_PER_LEVEL = 500;

/**
 * Calculates level from XP.
 *
 * @param xp - Total XP
 * @returns Level number (1-based)
 */
export function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/**
 * Calculates XP progress within current level.
 *
 * @param xp - Total XP
 * @returns Object with current XP in level and XP needed for next level
 */
export function calculateLevelProgress(xp: number): {
  currentLevelXp: number;
  xpForNextLevel: number;
  progressPercent: number;
} {
  const level = calculateLevel(xp);
  const currentLevelXp = xp - (level - 1) * XP_PER_LEVEL;
  const xpForNextLevel = XP_PER_LEVEL;
  const progressPercent = (currentLevelXp / xpForNextLevel) * 100;

  return { currentLevelXp, xpForNextLevel, progressPercent };
}

/**
 * Feedback messages based on score percentage.
 */
export const FEEDBACK_MESSAGES = {
  PERFECT: "Perfect score! You're a superstar!",
  EXCELLENT: "Amazing work! You really know your stuff!",
  GREAT: "Great job! Keep up the excellent work!",
  GOOD: "Good effort! You passed!",
  CLOSE: "You're getting there! A little more practice and you'll nail it!",
  KEEP_TRYING: "Keep trying! Practice makes perfect!",
} as const;

/**
 * Gets feedback message based on score percentage.
 *
 * @param percentage - Score percentage (0-100)
 * @param threshold - Passing threshold
 * @returns Appropriate feedback message
 */
export function getFeedbackMessage(
  percentage: number,
  threshold: number = THRESHOLDS.PASSING_SCORE
): string {
  if (percentage === 100) return FEEDBACK_MESSAGES.PERFECT;
  if (percentage >= 90) return FEEDBACK_MESSAGES.EXCELLENT;
  if (percentage >= 80) return FEEDBACK_MESSAGES.GREAT;
  if (percentage >= threshold) return FEEDBACK_MESSAGES.GOOD;
  if (percentage >= 50) return FEEDBACK_MESSAGES.CLOSE;
  return FEEDBACK_MESSAGES.KEEP_TRYING;
}

/**
 * Source applications for integrations.
 */
export const SOURCE_APPS = {
  SCHOLAR: "scholar-app",
  NYCOLOGIC: "nycologic",
  GEOBLOX: "geoblox",
  SCAN_GENIUS: "scan-genius",
} as const;

export type SourceApp = (typeof SOURCE_APPS)[keyof typeof SOURCE_APPS];

/**
 * AI Gateway configuration.
 */
export const AI_GATEWAY = {
  URL: "https://ai.gateway.lovable.dev/v1/chat/completions",
  DEFAULT_MODEL: "google/gemini-3-flash-preview",
  MAX_TOKENS_DEFAULT: 2000,
  TEMPERATURE_DEFAULT: 0.7,
  TEMPERATURE_GRADING: 0.3,
} as const;
