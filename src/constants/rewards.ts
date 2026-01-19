/**
 * Reward Constants
 *
 * XP, coins, and progression values used throughout the app.
 */

// ============================================================================
// XP Constants
// ============================================================================

/** XP required to advance one level */
export const XP_PER_LEVEL = 500;

/** Base XP for completing an activity */
export const BASE_XP = 10;

/** Maximum XP from a study goal */
export const STUDY_GOAL_MAX_XP = 25;

/** Quick action XP reward */
export const QUICK_ACTION_XP = 50;

// ============================================================================
// Coin Constants
// ============================================================================

/** Base coins for completing an activity */
export const BASE_COINS = 2;

/** Maximum coins from a study goal */
export const STUDY_GOAL_MAX_COINS = 10;

/** Quick action coin reward */
export const QUICK_ACTION_COINS = 10;

// ============================================================================
// Level Calculation
// ============================================================================

/**
 * Calculate player level from XP
 */
export function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/**
 * Calculate XP progress within current level
 */
export function calculateXpInLevel(xp: number): number {
  const level = calculateLevel(xp);
  return xp - (level - 1) * XP_PER_LEVEL;
}

/**
 * Calculate XP needed for next level
 */
export function calculateXpForNextLevel(xp: number): number {
  return XP_PER_LEVEL - calculateXpInLevel(xp);
}

/**
 * Calculate level progress percentage (0-100)
 */
export function calculateLevelProgress(xp: number): number {
  return (calculateXpInLevel(xp) / XP_PER_LEVEL) * 100;
}

// ============================================================================
// Reward Calculation
// ============================================================================

/**
 * Calculate XP earned from a score (score-based formula)
 */
export function calculateXpFromScore(score: number, passingThreshold = 70): number {
  if (score < passingThreshold) return 0;
  return Math.round(score * BASE_XP);
}

/**
 * Calculate coins earned from a score (score-based formula)
 */
export function calculateCoinsFromScore(score: number, passingThreshold = 70): number {
  if (score < passingThreshold) return 0;
  return Math.round(score * BASE_COINS);
}

// ============================================================================
// Default Rewards
// ============================================================================

export const DEFAULT_ASSIGNMENT_REWARDS = {
  XP: 50,
  COINS: 10,
} as const;

export const DEFAULT_PRACTICE_REWARDS = {
  XP: 25,
  COINS: 5,
} as const;

export const DEFAULT_GAME_REWARDS = {
  XP: 30,
  COINS: 8,
} as const;

// ============================================================================
// Streak Bonuses
// ============================================================================

export const STREAK_BONUSES = {
  /** Bonus XP per day of streak */
  XP_PER_DAY: 5,
  /** Maximum streak bonus XP */
  MAX_XP_BONUS: 50,
  /** Bonus coins per week of streak */
  COINS_PER_WEEK: 10,
} as const;

/**
 * Calculate streak bonus XP
 */
export function calculateStreakBonusXp(streakDays: number): number {
  return Math.min(streakDays * STREAK_BONUSES.XP_PER_DAY, STREAK_BONUSES.MAX_XP_BONUS);
}
