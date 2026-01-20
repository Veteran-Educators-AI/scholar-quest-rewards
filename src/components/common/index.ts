/**
 * Common Components
 *
 * Reusable UI components for consistent design across the app.
 */

// Design Tokens
export * from "./tokens";

// Stat Display Components
export { StatBadge, CoinBadge, XPBadge, StreakBadge } from "./StatBadge";
export type { StatBadgeProps, StatType } from "./StatBadge";

// Reward Display Components
export { RewardDisplay, RewardBadge, EarnedReward } from "./RewardDisplay";
export type { RewardDisplayProps } from "./RewardDisplay";

// Score Display Components
export {
  ScoreDisplay,
  PercentageScore,
  QuizScore,
  ComparisonScore,
} from "./ScoreDisplay";
export type { ScoreDisplayProps, ScoreFormat } from "./ScoreDisplay";

// Status Badge Components
export {
  StatusBadge,
  MasteryBadge,
  CompletedBadge,
  InProgressBadge,
  PendingBadge,
  MasteredBadge,
} from "./StatusBadge";
export type { StatusBadgeProps, MasteryBadgeProps, BadgeVariant } from "./StatusBadge";

// Empty State Components
export {
  EmptyState,
  NoSearchResults,
  NoAssignments,
  NoRewards,
  NoData,
} from "./EmptyState";
export type { EmptyStateProps, EmptyStateVariant } from "./EmptyState";

// Subject Tag Components
export { SubjectTag, SubjectList } from "./SubjectTag";
export type { SubjectTagProps } from "./SubjectTag";
