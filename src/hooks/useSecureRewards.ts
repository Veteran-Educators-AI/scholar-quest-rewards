/**
 * Secure Rewards Hook
 *
 * This hook has been migrated to React Query for better caching and state management.
 * Re-exported for backwards compatibility - existing imports will continue to work.
 *
 * @example
 * // Both imports work the same way:
 * import { useSecureRewards } from "@/hooks/useSecureRewards";
 * import { useSecureRewards } from "@/hooks/mutations";
 */

export {
  useSecureRewards,
  useAwardRewards,
  useRewardClaimCheck,
  type ClaimType,
  type ValidationData,
  type AwardRewardsParams,
  type AwardResult,
} from "./mutations/useAwardRewards";
