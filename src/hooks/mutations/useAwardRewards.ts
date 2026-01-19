/**
 * Award Rewards Mutation Hook
 *
 * Handles secure reward distribution using React Query mutations.
 * Replaces the old useSecureRewards hook.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/query";
import { checkRewardClaimed } from "@/lib/api/student";

// ============================================================================
// Types
// ============================================================================

export type ClaimType =
  | "practice_set"
  | "game"
  | "study_goal"
  | "assignment"
  | "challenge";

export interface ValidationData {
  score?: number;
  passing_threshold?: number;
  questions_answered?: number;
  correct_answers?: number;
  time_spent_seconds?: number;
  goal_index?: number;
}

export interface AwardRewardsParams {
  claimType: ClaimType;
  referenceId: string;
  xpAmount: number;
  coinAmount: number;
  reason: string;
  validationData?: ValidationData;
}

export interface AwardResult {
  success: boolean;
  xp_awarded?: number;
  coins_awarded?: number;
  new_xp_total?: number;
  new_coins_total?: number;
  error?: string;
  already_claimed?: boolean;
}

// ============================================================================
// API Functions
// ============================================================================

async function awardRewardsApi(params: AwardRewardsParams): Promise<AwardResult> {
  const { data, error } = await supabase.functions.invoke("award-rewards", {
    body: {
      claim_type: params.claimType,
      reference_id: params.referenceId,
      xp_amount: params.xpAmount,
      coin_amount: params.coinAmount,
      reason: params.reason,
      validation_data: params.validationData,
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to award rewards");
  }

  if (!data.success) {
    throw new Error(data.error || "Failed to award rewards");
  }

  return data;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to award rewards with optimistic updates
 */
export function useAwardRewards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: awardRewardsApi,
    onSuccess: (data) => {
      // Invalidate student profile to refresh XP/coins
      queryClient.invalidateQueries({ queryKey: queryKeys.students.profile("me") });

      // Invalidate reward claims
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards.claims() });
    },
    onError: (error) => {
      console.error("Award rewards error:", error);
    },
  });
}

/**
 * Hook to check if a reward has been claimed
 */
export function useRewardClaimCheck(
  claimType: ClaimType | undefined,
  referenceId: string | undefined
) {
  return useQuery({
    queryKey: queryKeys.rewards.claim(claimType ?? "", referenceId ?? ""),
    queryFn: () => checkRewardClaimed(claimType!, referenceId!),
    enabled: !!claimType && !!referenceId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Combined hook that provides both the mutation and claim check
 * This is a drop-in replacement for the old useSecureRewards hook
 */
export function useSecureRewards() {
  const mutation = useAwardRewards();

  return {
    awardRewards: mutation.mutateAsync,
    isAwarding: mutation.isPending,
    error: mutation.error?.message ?? null,
    // Expose the checkIfClaimed function for manual checks
    checkIfClaimed: checkRewardClaimed,
  };
}
