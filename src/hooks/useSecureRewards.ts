import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

type ClaimType = "practice_set" | "game" | "study_goal" | "assignment" | "challenge";

interface ValidationData {
  score?: number;
  passing_threshold?: number;
  questions_answered?: number;
  correct_answers?: number;
  time_spent_seconds?: number;
  goal_index?: number;
}

interface AwardRewardsParams {
  claimType: ClaimType;
  referenceId: string;
  xpAmount: number;
  coinAmount: number;
  reason: string;
  validationData?: ValidationData;
}

interface AwardResult {
  success: boolean;
  xp_awarded?: number;
  coins_awarded?: number;
  new_xp_total?: number;
  new_coins_total?: number;
  error?: string;
  already_claimed?: boolean;
}

export function useSecureRewards() {
  const [isAwarding, setIsAwarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const awardRewards = async (params: AwardRewardsParams): Promise<AwardResult> => {
    setIsAwarding(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("award-rewards", {
        body: {
          claim_type: params.claimType,
          reference_id: params.referenceId,
          xp_amount: params.xpAmount,
          coin_amount: params.coinAmount,
          reason: params.reason,
          validation_data: params.validationData,
        },
      });

      if (fnError) {
        const errorMessage = fnError.message || "Failed to award rewards";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      if (!data.success) {
        setError(data.error || "Failed to award rewards");
        return data;
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsAwarding(false);
    }
  };

  const checkIfClaimed = async (claimType: ClaimType, referenceId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const claimKey = `${user.id}:${claimType}:${referenceId}`;
      
      const { data, error } = await supabase
        .from("reward_claims")
        .select("id")
        .eq("claim_key", claimKey)
        .maybeSingle();

      if (error) {
        console.error("Error checking claim:", error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error("Error checking claim:", err);
      return false;
    }
  };

  return {
    awardRewards,
    checkIfClaimed,
    isAwarding,
    error,
  };
}
