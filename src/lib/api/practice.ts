/**
 * Practice API Functions
 *
 * Data fetching functions for practice sets and questions.
 */

import { supabase } from "@/integrations/supabase/client";
import type { PracticeFilters } from "@/lib/query/keys";

// ============================================================================
// Types
// ============================================================================

export interface PracticeSet {
  id: string;
  student_id: string;
  title: string;
  subject: string | null;
  xp_reward: number;
  coin_reward: number;
  score: number | null;
  status: string;
  skill_tags: string[] | null;
  total_questions: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface PracticeQuestion {
  id: string;
  practice_set_id: string;
  prompt: string;
  question_type: string;
  skill_tag: string | null;
  difficulty: number;
  answer_key: unknown;
  options: unknown | null;
  hint: string | null;
  student_answer: string | null;
  is_correct: boolean | null;
  answered_at: string | null;
}

export interface PracticeSetWithQuestions extends PracticeSet {
  questions: PracticeQuestion[];
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Fetch practice sets for the current student
 */
export async function fetchPracticeSets(
  filters?: PracticeFilters
): Promise<PracticeSet[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  let query = supabase
    .from("practice_sets")
    .select("*")
    .eq("student_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (filters?.subject) {
    query = query.eq("subject", filters.subject);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.skillTags && filters.skillTags.length > 0) {
    query = query.overlaps("skill_tags", filters.skillTags);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch practice sets: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Fetch a single practice set by ID
 */
export async function fetchPracticeSet(id: string): Promise<PracticeSet | null> {
  const { data, error } = await supabase
    .from("practice_sets")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch practice set: ${error.message}`);
  }

  return data;
}

/**
 * Fetch a practice set with all its questions
 */
export async function fetchPracticeSetWithQuestions(
  id: string
): Promise<PracticeSetWithQuestions | null> {
  const { data, error } = await supabase
    .from("practice_sets")
    .select(
      `
      *,
      questions:practice_questions(*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch practice set: ${error.message}`);
  }

  return data as PracticeSetWithQuestions;
}

/**
 * Fetch questions for a practice set
 */
export async function fetchPracticeQuestions(
  practiceSetId: string
): Promise<PracticeQuestion[]> {
  const { data, error } = await supabase
    .from("practice_questions")
    .select("*")
    .eq("practice_set_id", practiceSetId)
    .order("id");

  if (error) {
    throw new Error(`Failed to fetch practice questions: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Fetch student's active (incomplete) practice sets
 */
export async function fetchActivePracticeSets(): Promise<PracticeSet[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("practice_sets")
    .select("*")
    .eq("student_id", userData.user.id)
    .neq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch active practice sets: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Fetch completed practice sets with scores
 */
export async function fetchCompletedPracticeSets(): Promise<PracticeSet[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("practice_sets")
    .select("*")
    .eq("student_id", userData.user.id)
    .eq("status", "completed")
    .not("score", "is", null)
    .order("completed_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch completed practice sets: ${error.message}`);
  }

  return data ?? [];
}
