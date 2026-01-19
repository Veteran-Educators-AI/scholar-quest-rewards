/**
 * UI Constants
 *
 * Colors, timings, and display values for the user interface.
 */

// ============================================================================
// Timeouts & Delays
// ============================================================================

/** Default prefetch delay in ms */
export const PREFETCH_DELAY = 100;

/** Route prefetch delay in ms */
export const ROUTE_PREFETCH_DELAY = 1000;

/** Sign-up timeout in ms */
export const SIGNUP_TIMEOUT = 5000;

/** Sign-out timeout in ms */
export const SIGNOUT_TIMEOUT = 10000;

/** Toast notification duration in ms */
export const TOAST_DURATION = 3000;

/** Animation duration for transitions in ms */
export const ANIMATION_DURATION = 300;

// ============================================================================
// Vibration Patterns
// ============================================================================

/** Standard notification vibration pattern [vibrate, pause, vibrate] */
export const NOTIFICATION_VIBRATION = [100, 50, 100] as const;

/** Celebration vibration pattern */
export const CELEBRATION_VIBRATION = [50, 30, 50, 30, 100, 50, 150] as const;

/** Error vibration pattern */
export const ERROR_VIBRATION = [200, 100, 200] as const;

// ============================================================================
// Theme Colors by Subject
// ============================================================================

export const SUBJECT_COLORS = {
  math: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-300",
    gradient: "from-blue-500 to-blue-600",
  },
  reading: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-300",
    gradient: "from-purple-500 to-purple-600",
  },
  science: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-300",
    gradient: "from-green-500 to-green-600",
  },
  writing: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    border: "border-orange-300",
    gradient: "from-orange-500 to-orange-600",
  },
  default: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-300",
    gradient: "from-gray-500 to-gray-600",
  },
} as const;

export type SubjectTheme = keyof typeof SUBJECT_COLORS;

export function getSubjectColors(subject: string | null | undefined) {
  if (!subject) return SUBJECT_COLORS.default;
  const key = subject.toLowerCase() as SubjectTheme;
  return SUBJECT_COLORS[key] ?? SUBJECT_COLORS.default;
}

// ============================================================================
// Reward Type Display
// ============================================================================

export const REWARD_TYPE_EMOJI = {
  toy: "🧸",
  game: "🎮",
  outing: "🎢",
  treat: "🍦",
  screen_time: "📺",
  sleepover: "🏠",
  custom: "🎁",
} as const;

export const REWARD_TYPE_LABELS = {
  toy: "Toy",
  game: "Game",
  outing: "Outing",
  treat: "Treat",
  screen_time: "Screen Time",
  sleepover: "Sleepover",
  custom: "Custom",
} as const;

// ============================================================================
// Rarity Colors
// ============================================================================

export const RARITY_COLORS = {
  common: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-300",
  },
  rare: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-300",
  },
  epic: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-300",
  },
  legendary: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-400",
  },
} as const;

// ============================================================================
// Status Colors
// ============================================================================

export const STATUS_COLORS = {
  on_task: "bg-green-500",
  off_task: "bg-red-500",
  needs_support: "bg-yellow-500",
  excellent: "bg-blue-500",
  absent: "bg-gray-500",
  late: "bg-orange-500",
} as const;

export const ASSIGNMENT_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
} as const;

export const ATTEMPT_STATUS_COLORS = {
  not_started: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  submitted: "bg-yellow-100 text-yellow-800",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
} as const;
