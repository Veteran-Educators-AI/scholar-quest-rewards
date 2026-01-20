/**
 * Color Design Tokens
 *
 * Centralized color definitions for consistent styling across the app.
 * These tokens map semantic meaning to Tailwind classes.
 */

// ============================================================================
// Subject Colors
// ============================================================================

export type Subject =
  | "math"
  | "reading"
  | "science"
  | "writing"
  | "history"
  | "art"
  | "music"
  | "default";

export interface SubjectColorScheme {
  bg: string;
  text: string;
  border: string;
  gradient: string;
  icon: string;
}

export const SUBJECT_COLORS: Record<Subject, SubjectColorScheme> = {
  math: {
    bg: "bg-blue-100 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-700",
    gradient: "from-blue-500 to-blue-600",
    icon: "🔢",
  },
  reading: {
    bg: "bg-purple-100 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-300 dark:border-purple-700",
    gradient: "from-purple-500 to-purple-600",
    icon: "📖",
  },
  science: {
    bg: "bg-green-100 dark:bg-green-900/20",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-300 dark:border-green-700",
    gradient: "from-green-500 to-green-600",
    icon: "🔬",
  },
  writing: {
    bg: "bg-orange-100 dark:bg-orange-900/20",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-300 dark:border-orange-700",
    gradient: "from-orange-500 to-orange-600",
    icon: "✏️",
  },
  history: {
    bg: "bg-amber-100 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-700",
    gradient: "from-amber-500 to-amber-600",
    icon: "🏛️",
  },
  art: {
    bg: "bg-pink-100 dark:bg-pink-900/20",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-300 dark:border-pink-700",
    gradient: "from-pink-500 to-pink-600",
    icon: "🎨",
  },
  music: {
    bg: "bg-indigo-100 dark:bg-indigo-900/20",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-300 dark:border-indigo-700",
    gradient: "from-indigo-500 to-indigo-600",
    icon: "🎵",
  },
  default: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-300 dark:border-gray-700",
    gradient: "from-gray-500 to-gray-600",
    icon: "📚",
  },
};

/**
 * Get subject color scheme by name (case-insensitive)
 */
export function getSubjectColors(subject: string | null | undefined): SubjectColorScheme {
  if (!subject) return SUBJECT_COLORS.default;

  const normalized = subject.toLowerCase();

  // Handle common variations
  if (normalized.includes("math")) return SUBJECT_COLORS.math;
  if (normalized.includes("reading") || normalized.includes("english") || normalized.includes("ela"))
    return SUBJECT_COLORS.reading;
  if (normalized.includes("science")) return SUBJECT_COLORS.science;
  if (normalized.includes("writing")) return SUBJECT_COLORS.writing;
  if (normalized.includes("history") || normalized.includes("social"))
    return SUBJECT_COLORS.history;
  if (normalized.includes("art")) return SUBJECT_COLORS.art;
  if (normalized.includes("music")) return SUBJECT_COLORS.music;

  return SUBJECT_COLORS.default;
}

// ============================================================================
// Mastery Level Colors
// ============================================================================

export type MasteryLevel = "not_started" | "developing" | "approaching" | "mastered";

export interface MasteryColorScheme {
  bg: string;
  text: string;
  border: string;
  label: string;
}

export const MASTERY_COLORS: Record<MasteryLevel, MasteryColorScheme> = {
  not_started: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-muted",
    label: "Not Started",
  },
  developing: {
    bg: "bg-warning/20",
    text: "text-warning",
    border: "border-warning/50",
    label: "Developing",
  },
  approaching: {
    bg: "bg-primary/20",
    text: "text-primary",
    border: "border-primary/50",
    label: "Approaching",
  },
  mastered: {
    bg: "bg-success/20",
    text: "text-success",
    border: "border-success/50",
    label: "Mastered",
  },
};

// ============================================================================
// Rarity Colors (Collectibles)
// ============================================================================

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface RarityColorScheme {
  bg: string;
  text: string;
  border: string;
  glow: string;
  label: string;
}

export const RARITY_COLORS: Record<Rarity, RarityColorScheme> = {
  common: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-gray-300 dark:border-gray-600",
    glow: "",
    label: "Common",
  },
  rare: {
    bg: "bg-gradient-to-br from-blue-500/10 to-blue-600/10",
    text: "text-blue-500",
    border: "border-blue-400",
    glow: "shadow-[0_0_20px_hsl(217_91%_60%/0.3)]",
    label: "Rare",
  },
  epic: {
    bg: "bg-gradient-to-br from-purple-500/10 to-purple-600/10",
    text: "text-purple-500",
    border: "border-purple-400",
    glow: "shadow-[0_0_20px_hsl(262_83%_58%/0.4)]",
    label: "Epic",
  },
  legendary: {
    bg: "bg-gradient-to-br from-yellow-500/10 to-orange-500/10",
    text: "text-yellow-500",
    border: "border-yellow-400",
    glow: "shadow-[0_0_30px_hsl(43_96%_56%/0.5)]",
    label: "Legendary",
  },
};

// ============================================================================
// Grade/Score Colors
// ============================================================================

export interface GradeColorScheme {
  bg: string;
  text: string;
  border: string;
  label: string;
}

export const GRADE_COLORS = {
  excellent: {
    bg: "bg-green-100 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-300 dark:border-green-700",
    label: "Excellent",
  },
  good: {
    bg: "bg-blue-100 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-300 dark:border-blue-700",
    label: "Good",
  },
  satisfactory: {
    bg: "bg-yellow-100 dark:bg-yellow-900/20",
    text: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-300 dark:border-yellow-700",
    label: "Satisfactory",
  },
  needsImprovement: {
    bg: "bg-orange-100 dark:bg-orange-900/20",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-300 dark:border-orange-700",
    label: "Needs Improvement",
  },
  failing: {
    bg: "bg-red-100 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-300 dark:border-red-700",
    label: "Needs Work",
  },
} as const;

/**
 * Get grade color scheme based on score percentage
 */
export function getGradeColors(score: number): GradeColorScheme {
  if (score >= 90) return GRADE_COLORS.excellent;
  if (score >= 80) return GRADE_COLORS.good;
  if (score >= 70) return GRADE_COLORS.satisfactory;
  if (score >= 65) return GRADE_COLORS.needsImprovement;
  return GRADE_COLORS.failing;
}

// ============================================================================
// Status Colors
// ============================================================================

export type Status =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "completed"
  | "pending"
  | "active"
  | "archived";

export interface StatusColorScheme {
  bg: string;
  text: string;
  border: string;
  label: string;
}

export const STATUS_COLORS: Record<Status, StatusColorScheme> = {
  not_started: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-muted",
    label: "Not Started",
  },
  pending: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-muted",
    label: "Pending",
  },
  in_progress: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary",
    label: "In Progress",
  },
  active: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary",
    label: "Active",
  },
  submitted: {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning",
    label: "Submitted",
  },
  completed: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success",
    label: "Completed",
  },
  archived: {
    bg: "bg-muted/50",
    text: "text-muted-foreground/70",
    border: "border-muted/50",
    label: "Archived",
  },
};

// ============================================================================
// Rank Colors (Leaderboard)
// ============================================================================

export const RANK_COLORS = {
  first: {
    bg: "bg-gradient-to-r from-yellow-100/80 to-yellow-50/50 dark:from-yellow-900/30 dark:to-yellow-800/20",
    text: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-300 dark:border-yellow-600",
  },
  second: {
    bg: "bg-gradient-to-r from-gray-200/50 to-gray-100/30 dark:from-gray-700/50 dark:to-gray-800/30",
    text: "text-gray-500 dark:text-gray-400",
    border: "border-gray-300 dark:border-gray-600",
  },
  third: {
    bg: "bg-gradient-to-r from-amber-100/50 to-amber-50/30 dark:from-amber-900/30 dark:to-amber-800/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-300 dark:border-amber-600",
  },
  current: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary",
  },
  default: {
    bg: "bg-card",
    text: "text-foreground",
    border: "border-border",
  },
} as const;

/**
 * Get rank color scheme
 */
export function getRankColors(rank: number, isCurrentUser: boolean = false) {
  if (isCurrentUser) return RANK_COLORS.current;
  if (rank === 1) return RANK_COLORS.first;
  if (rank === 2) return RANK_COLORS.second;
  if (rank === 3) return RANK_COLORS.third;
  return RANK_COLORS.default;
}

// ============================================================================
// Reward Type Icons
// ============================================================================

export type RewardType =
  | "toy"
  | "game"
  | "outing"
  | "treat"
  | "screen_time"
  | "sleepover"
  | "custom";

export const REWARD_TYPE_ICONS: Record<RewardType, string> = {
  toy: "🧸",
  game: "🎮",
  outing: "🎢",
  treat: "🍦",
  screen_time: "📺",
  sleepover: "🏠",
  custom: "🎁",
};

/**
 * Get reward type icon by type (with fallback)
 */
export function getRewardTypeIcon(rewardType: string | null | undefined): string {
  if (!rewardType) return REWARD_TYPE_ICONS.custom;
  return REWARD_TYPE_ICONS[rewardType as RewardType] || REWARD_TYPE_ICONS.custom;
}
