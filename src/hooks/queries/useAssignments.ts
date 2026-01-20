/**
 * Assignment Query Hooks
 *
 * Fetches and caches assignment data using React Query.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, type AssignmentFilters } from "@/lib/query";
import {
  fetchAssignments,
  fetchAssignment,
  fetchAssignmentWithAttempts,
  fetchAssignmentAttempts,
  fetchActiveAssignments,
} from "@/lib/api/assignments";
import type {
  Assignment,
  AssignmentAttempt,
  AssignmentWithAttempts,
} from "@/lib/api/assignments";

/**
 * Hook to fetch all assignments with optional filters
 */
export function useAssignments(filters?: AssignmentFilters) {
  return useQuery({
    queryKey: queryKeys.assignments.list(filters),
    queryFn: () => fetchAssignments(filters),
    staleTime: STALE_TIMES.ASSIGNMENTS,
  });
}

/**
 * Hook to fetch a single assignment by ID
 */
export function useAssignment(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.assignments.detail(id ?? ""),
    queryFn: () => fetchAssignment(id!),
    enabled: !!id,
    staleTime: STALE_TIMES.ASSIGNMENTS,
  });
}

/**
 * Hook to fetch an assignment with all its attempts
 */
export function useAssignmentWithAttempts(id: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.assignments.detail(id ?? ""), "with-attempts"],
    queryFn: () => fetchAssignmentWithAttempts(id!),
    enabled: !!id,
    staleTime: STALE_TIMES.ASSIGNMENTS,
  });
}

/**
 * Hook to fetch attempts for a specific assignment
 */
export function useAssignmentAttempts(assignmentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.assignments.attempts(assignmentId ?? ""),
    queryFn: () => fetchAssignmentAttempts(assignmentId!),
    enabled: !!assignmentId,
    staleTime: STALE_TIMES.PROGRESS,
  });
}

/**
 * Hook to fetch only active (pending/in-progress) assignments
 */
export function useActiveAssignments() {
  return useQuery({
    queryKey: queryKeys.assignments.list({ status: "active" }),
    queryFn: fetchActiveAssignments,
    staleTime: STALE_TIMES.ASSIGNMENTS,
  });
}

// Re-export types
export type { Assignment, AssignmentAttempt, AssignmentWithAttempts };
