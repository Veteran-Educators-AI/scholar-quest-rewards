/**
 * Assignment API Functions
 *
 * Data fetching functions for assignment-related queries.
 */

import { supabase } from "@/integrations/supabase/client";
import type { AssignmentFilters } from "@/lib/query/keys";

// ============================================================================
// Types
// ============================================================================

export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  xp_reward: number;
  coin_reward: number;
  status: "pending" | "active" | "completed" | "archived";
  due_date: string | null;
  standard_id: string | null;
  class_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssignmentAttempt {
  id: string;
  assignment_id: string;
  student_id: string;
  score: number | null;
  mode: "paper" | "in_app";
  status: "not_started" | "in_progress" | "submitted" | "verified" | "rejected";
  started_at: string | null;
  submitted_at: string | null;
  created_at: string;
}

export interface AssignmentWithAttempts extends Assignment {
  attempts: AssignmentAttempt[];
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Fetch assignments for the current student
 */
export async function fetchAssignments(
  filters?: AssignmentFilters
): Promise<Assignment[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  let query = supabase
    .from("assignments")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.subject) {
    query = query.eq("subject", filters.subject);
  }

  if (filters?.classId) {
    query = query.eq("class_id", filters.classId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch assignments: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Fetch a single assignment by ID
 */
export async function fetchAssignment(id: string): Promise<Assignment | null> {
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch assignment: ${error.message}`);
  }

  return data;
}

/**
 * Fetch an assignment with its attempts for the current student
 */
export async function fetchAssignmentWithAttempts(
  id: string
): Promise<AssignmentWithAttempts | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("assignments")
    .select(
      `
      *,
      attempts:attempts(*)
    `
    )
    .eq("id", id)
    .eq("attempts.student_id", userData.user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch assignment: ${error.message}`);
  }

  return data as AssignmentWithAttempts;
}

/**
 * Fetch attempts for an assignment
 */
export async function fetchAssignmentAttempts(
  assignmentId: string
): Promise<AssignmentAttempt[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("attempts")
    .select("*")
    .eq("assignment_id", assignmentId)
    .eq("student_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch attempts: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Fetch student's active assignments (pending or in progress)
 */
export async function fetchActiveAssignments(): Promise<Assignment[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .in("status", ["pending", "active"])
    .order("due_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch active assignments: ${error.message}`);
  }

  return data ?? [];
}
