/**
 * API Request Types
 */

import type { ClaimType, ValidationData } from "../entities/rewards";
import type { AttemptMode } from "../entities/assignment";

// ============================================================================
// Award Rewards
// ============================================================================

export interface AwardRewardsRequest {
  claim_type: ClaimType;
  reference_id: string;
  xp_amount: number;
  coin_amount: number;
  reason: string;
  validation_data?: ValidationData;
}

// ============================================================================
// Grade Assignment
// ============================================================================

export interface GradeAssignmentRequest {
  attempt_id: string;
  answers: Record<string, string | string[]>;
  mode?: AttemptMode;
}

export interface VerifyAttemptRequest {
  attempt_id: string;
  score: number;
  feedback?: string;
}

// ============================================================================
// Practice
// ============================================================================

export interface CreatePracticeSetRequest {
  title: string;
  description?: string;
  subject?: string;
  standard_id?: string;
  skill_tags?: string[];
  xp_reward?: number;
  coin_reward?: number;
}

export interface SubmitPracticeAnswerRequest {
  question_id: string;
  answer: string | string[];
}

// ============================================================================
// Study Plan
// ============================================================================

export interface GenerateStudyPlanRequest {
  student_id: string;
  weak_topics?: string[];
  subject?: string;
  grade_level?: number;
}

// ============================================================================
// Sync Requests
// ============================================================================

export interface SyncStudentRequest {
  student_id: string;
  scholar_student_id?: string;
  nickname?: string;
  grade?: string;
}

export interface SyncToNycologicRequest {
  type: "assignment_completed" | "student_progress" | "badge_earned" | "mastery_update";
  data: Record<string, unknown>;
}

// ============================================================================
// Invite
// ============================================================================

export interface GenerateInviteRequest {
  action?: "generate" | "bulk_generate" | "list" | "revoke";
  student_name?: string;
  student_email?: string;
  external_ref?: string;
  class_id?: string;
  expires_days?: number;
  students?: Array<{
    name?: string;
    email?: string;
    external_ref?: string;
  }>;
  token?: string;
  id?: string;
}

// ============================================================================
// Parent Notification
// ============================================================================

export type NotificationType =
  | "badge_earned"
  | "streak_warning"
  | "reward_earned"
  | "assignment_completed"
  | "points_deducted"
  | "pledge_near_completion";

export interface SendParentNotificationRequest {
  type: NotificationType;
  student_id: string;
  data: {
    badge_name?: string;
    current_streak?: number;
    xp_earned?: number;
    coins_earned?: number;
    assignment_title?: string;
    score?: number;
    points_deducted?: number;
    reason?: string;
    student_name?: string;
    current_coins?: number;
    threshold?: number;
    progress_percent?: number;
    reward_description?: string;
    coins_needed?: number;
  };
}
