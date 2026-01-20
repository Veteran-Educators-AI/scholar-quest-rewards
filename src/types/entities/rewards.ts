/**
 * Rewards Entity Types
 */

import type { BadgeId, RewardClaimId, PledgeId, UserId } from "../utils/branded";

// ============================================================================
// Claim Types
// ============================================================================

export type ClaimType = "practice_set" | "game" | "study_goal" | "assignment" | "challenge";

// ============================================================================
// Reward Claim
// ============================================================================

export interface RewardClaim {
  id: RewardClaimId;
  student_id: UserId;
  claim_type: ClaimType;
  reference_id: string;
  xp_amount: number;
  coin_amount: number;
  reason: string;
  claimed_at: string;
  validation_data?: ValidationData;
}

export interface ValidationData {
  score?: number;
  passing_threshold?: number;
  questions_answered?: number;
  correct_answers?: number;
  time_spent_seconds?: number;
}

export interface AwardRewardsParams {
  claimType: ClaimType;
  referenceId: string;
  xpAmount: number;
  coinAmount: number;
  reason: string;
  validationData?: ValidationData;
}

// ============================================================================
// Badge
// ============================================================================

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon_url: string | null;
  xp_reward: number;
  category: string;
  rarity: BadgeRarity;
  unlock_criteria: Record<string, unknown>;
  created_at?: string;
}

export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export interface EarnedBadge {
  id: string;
  student_id: UserId;
  badge_id: BadgeId;
  earned_at: string;
  badge?: Badge;
}

// ============================================================================
// Pledges (Parent Rewards)
// ============================================================================

export type RewardType = "toy" | "game" | "outing" | "treat" | "screen_time" | "sleepover" | "custom";

export interface PointPledge {
  id: PledgeId;
  parent_id: UserId;
  student_id: UserId;
  coin_threshold: number;
  reward_description: string;
  reward_type: RewardType;
  bonus_coins: number;
  claimed: boolean;
  claimed_at: string | null;
  created_at?: string;
}

export interface BadgePledge {
  id: PledgeId;
  parent_id: UserId;
  student_id: UserId;
  badge_id: BadgeId;
  reward_description: string;
  claimed: boolean;
  claimed_at: string | null;
  created_at?: string;
}

// ============================================================================
// Collectibles
// ============================================================================

export type CollectibleRarity = "common" | "rare" | "epic" | "legendary";
export type CollectibleSlot = "frame" | "background" | "hat" | "pet" | "accessory";

export interface Collectible {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  rarity: CollectibleRarity;
  slot: CollectibleSlot;
  unlock_cost: number;
  earned?: boolean;
}

export interface EquippedItems {
  frame?: Collectible;
  background?: Collectible;
  hat?: Collectible;
  pet?: Collectible;
  accessory?: Collectible;
}

// ============================================================================
// Challenges
// ============================================================================

export interface Challenge {
  id: string;
  title: string;
  description: string;
  xp_bonus: number;
  coin_bonus: number;
  min_assignments: number;
  theme: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface ChallengeProgress {
  challenge_id: string;
  student_id: UserId;
  assignments_completed: number;
  completed: boolean;
  completed_at: string | null;
}
