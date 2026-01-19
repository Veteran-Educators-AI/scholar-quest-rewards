/**
 * Student API Functions
 *
 * Data fetching functions for student-related queries.
 * These are used by React Query hooks.
 */

import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// Types
// ============================================================================

export interface StudentProfile {
  id: string;
  coins: number;
  xp: number;
  current_streak: number;
  longest_streak: number;
  streak_shield_available: boolean;
  grade_level: number | null;
  math_level: string | null;
  reading_level: string | null;
  skill_tags: string[] | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  accommodations: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface StudentProgress {
  total_assignments: number;
  completed_assignments: number;
  total_practice_sets: number;
  completed_practice_sets: number;
  average_score: number;
  weekly_xp: number;
  weekly_coins: number;
}

export interface GeometryMastery {
  questions_attempted: number;
  questions_correct: number;
  mastery_percentage: number;
  geoblox_unlocked: boolean;
  unlocked_at: string | null;
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Fetch the current user's student profile
 */
export async function fetchStudentProfile(): Promise<StudentProfile | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // No record found
    throw new Error(`Failed to fetch student profile: ${error.message}`);
  }

  return data;
}

/**
 * Fetch a student profile by ID
 */
export async function fetchStudentProfileById(
  studentId: string
): Promise<StudentProfile | null> {
  const { data, error } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("id", studentId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch student profile: ${error.message}`);
  }

  return data;
}

/**
 * Fetch geometry mastery for current user (for GeoBlox unlock)
 */
export async function fetchGeometryMastery(): Promise<GeometryMastery | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("geometry_mastery")
    .select("*")
    .eq("student_id", userData.user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No record means no progress yet
      return {
        questions_attempted: 0,
        questions_correct: 0,
        mastery_percentage: 0,
        geoblox_unlocked: false,
        unlocked_at: null,
      };
    }
    throw new Error(`Failed to fetch geometry mastery: ${error.message}`);
  }

  return {
    questions_attempted: data.questions_attempted,
    questions_correct: data.questions_correct,
    mastery_percentage: Number(data.mastery_percentage),
    geoblox_unlocked: data.geoblox_unlocked,
    unlocked_at: data.unlocked_at,
  };
}

/**
 * Fetch student's reward claims to check what's been claimed
 */
export async function fetchRewardClaims(
  claimType?: string
): Promise<{ claim_key: string; claimed_at: string }[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  let query = supabase
    .from("reward_claims")
    .select("claim_key, claimed_at")
    .eq("student_id", userData.user.id);

  if (claimType) {
    query = query.like("claim_key", `%:${claimType}:%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch reward claims: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Check if a specific reward has been claimed
 */
export async function checkRewardClaimed(
  claimType: string,
  referenceId: string
): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const claimKey = `${userData.user.id}:${claimType}:${referenceId}`;

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
}
