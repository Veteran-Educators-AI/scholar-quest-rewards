/**
 * Award Rewards Edge Function
 *
 * Validates and awards XP/coins to students with anti-fraud protections.
 * Uses secure database function to prevent client-side manipulation.
 */

import {
  createHandler,
  requireAuth,
  parseBody,
  logRequest,
  createSuccessResponse,
  createErrorResponse,
  AwardRewardsRequestSchema,
  THRESHOLDS,
  REWARDS,
  type MiddlewareContext,
  type AwardRewardsRequest,
} from "../_shared/index.ts";

/**
 * Result from secure reward function.
 */
interface AwardResult {
  success: boolean;
  xp_awarded: number;
  coins_awarded: number;
  new_xp_total: number;
  new_coins_total: number;
  already_claimed?: boolean;
}

/**
 * Validates claim based on type and reference.
 */
async function validateClaim(
  ctx: MiddlewareContext,
  request: AwardRewardsRequest
): Promise<{ valid: boolean; error?: string }> {
  const { supabase, user } = ctx;
  const { claim_type, reference_id, xp_amount, coin_amount, validation_data } = request;

  if (!user) {
    return { valid: false, error: "User not authenticated" };
  }

  switch (claim_type) {
    case "practice_set": {
      const { data: practiceSet, error } = await supabase
        .from("practice_sets")
        .select("id, student_id, status, score, xp_reward, coin_reward")
        .eq("id", reference_id)
        .single();

      if (error || !practiceSet) {
        return { valid: false, error: "Practice set not found" };
      }

      if (practiceSet.student_id !== user.id) {
        return { valid: false, error: "Practice set does not belong to this user" };
      }

      if (practiceSet.status !== "completed") {
        return { valid: false, error: "Practice set is not completed" };
      }

      if (!practiceSet.score || practiceSet.score < THRESHOLDS.PRACTICE_MINIMUM) {
        return {
          valid: false,
          error: `Score does not meet the minimum threshold (${THRESHOLDS.PRACTICE_MINIMUM}%)`,
        };
      }

      if (xp_amount > practiceSet.xp_reward || coin_amount > practiceSet.coin_reward) {
        return { valid: false, error: "Requested rewards exceed allowed amounts" };
      }

      return { valid: true };
    }

    case "game": {
      const { data: game, error } = await supabase
        .from("skill_games")
        .select("id, student_id, status, high_score, xp_reward, coin_reward")
        .eq("id", reference_id)
        .single();

      if (error || !game) {
        return { valid: false, error: "Game not found" };
      }

      if (game.student_id !== user.id) {
        return { valid: false, error: "Game does not belong to this user" };
      }

      const score = validation_data?.score;
      if (!score || score < THRESHOLDS.GAME_MINIMUM) {
        return {
          valid: false,
          error: `Score does not meet the minimum threshold (${THRESHOLDS.GAME_MINIMUM}%)`,
        };
      }

      if (xp_amount > game.xp_reward || coin_amount > game.coin_reward) {
        return { valid: false, error: "Requested rewards exceed allowed amounts" };
      }

      return { valid: true };
    }

    case "study_goal": {
      if (validation_data?.goal_index === undefined) {
        return { valid: false, error: "Missing goal index" };
      }

      if (xp_amount > REWARDS.STUDY_GOAL_MAX_XP || coin_amount > REWARDS.STUDY_GOAL_MAX_COINS) {
        return {
          valid: false,
          error: `Study goal rewards exceed maximum (${REWARDS.STUDY_GOAL_MAX_XP} XP, ${REWARDS.STUDY_GOAL_MAX_COINS} coins)`,
        };
      }

      return { valid: true };
    }

    case "assignment": {
      const { data: attempt, error } = await supabase
        .from("attempts")
        .select("id, student_id, status, score, assignment_id")
        .eq("id", reference_id)
        .single();

      if (error || !attempt) {
        return { valid: false, error: "Attempt not found" };
      }

      if (attempt.student_id !== user.id) {
        return { valid: false, error: "Attempt does not belong to this user" };
      }

      if (attempt.status !== "verified" && attempt.status !== "submitted") {
        return { valid: false, error: "Attempt is not in a valid state for rewards" };
      }

      return { valid: true };
    }

    case "challenge": {
      const { data: participant, error } = await supabase
        .from("challenge_participants")
        .select("id, student_id, completed_at, rewards_claimed, challenge:challenges(xp_bonus, coin_bonus)")
        .eq("id", reference_id)
        .single();

      if (error || !participant) {
        return { valid: false, error: "Challenge participation not found" };
      }

      if (participant.student_id !== user.id) {
        return { valid: false, error: "Challenge does not belong to this user" };
      }

      if (!participant.completed_at) {
        return { valid: false, error: "Challenge not completed" };
      }

      if (participant.rewards_claimed) {
        return { valid: false, error: "Challenge rewards already claimed" };
      }

      return { valid: true };
    }

    default:
      return { valid: false, error: `Unknown claim type: ${claim_type}` };
  }
}

/**
 * Main handler for awarding rewards.
 */
async function handleAwardRewards(
  _req: Request,
  ctx: MiddlewareContext
): Promise<Response> {
  const request = ctx.body as AwardRewardsRequest;
  const { user, supabase } = ctx;

  if (!user) {
    return createErrorResponse("UNAUTHORIZED", "User not authenticated", {
      cors: ctx.corsHeaders,
    });
  }

  // Validate the claim
  const validation = await validateClaim(ctx, request);
  if (!validation.valid) {
    console.error(`Validation failed for ${request.claim_type}:`, validation.error);
    return createErrorResponse(
      "VALIDATION_ERROR",
      validation.error,
      { cors: ctx.corsHeaders }
    );
  }

  // Call the secure database function to award rewards
  const { data: result, error: awardError } = await supabase.rpc(
    "award_rewards_secure",
    {
      p_student_id: user.id,
      p_claim_type: request.claim_type,
      p_reference_id: request.reference_id,
      p_xp_amount: request.xp_amount,
      p_coin_amount: request.coin_amount,
      p_reason: request.reason,
    }
  );

  if (awardError) {
    console.error("Error awarding rewards:", awardError);
    return createErrorResponse(
      "DATABASE_ERROR",
      awardError.message,
      { cors: ctx.corsHeaders }
    );
  }

  console.log(`Rewards awarded successfully:`, result);

  return createSuccessResponse<AwardResult>(result, {
    cors: ctx.corsHeaders,
    requestId: ctx.requestId,
  });
}

// Create and export the handler with middleware
Deno.serve(
  createHandler(handleAwardRewards, {
    middleware: [logRequest, requireAuth, parseBody(AwardRewardsRequestSchema)],
  })
);
