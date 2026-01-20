/**
 * Practice Set Query Hooks
 *
 * Fetches and caches practice set data using React Query.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, type PracticeFilters } from "@/lib/query";
import {
  fetchPracticeSets,
  fetchPracticeSet,
  fetchPracticeSetWithQuestions,
  fetchPracticeQuestions,
  fetchActivePracticeSets,
  fetchCompletedPracticeSets,
} from "@/lib/api/practice";
import type {
  PracticeSet,
  PracticeQuestion,
  PracticeSetWithQuestions,
} from "@/lib/api/practice";

/**
 * Hook to fetch all practice sets with optional filters
 */
export function usePracticeSets(filters?: PracticeFilters) {
  return useQuery({
    queryKey: queryKeys.practice.list(filters),
    queryFn: () => fetchPracticeSets(filters),
    staleTime: STALE_TIMES.ASSIGNMENTS,
  });
}

/**
 * Hook to fetch a single practice set by ID
 */
export function usePracticeSet(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.practice.detail(id ?? ""),
    queryFn: () => fetchPracticeSet(id!),
    enabled: !!id,
    staleTime: STALE_TIMES.ASSIGNMENTS,
  });
}

/**
 * Hook to fetch a practice set with all its questions
 */
export function usePracticeSetWithQuestions(id: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.practice.detail(id ?? ""), "with-questions"],
    queryFn: () => fetchPracticeSetWithQuestions(id!),
    enabled: !!id,
    staleTime: STALE_TIMES.ASSIGNMENTS,
  });
}

/**
 * Hook to fetch questions for a specific practice set
 */
export function usePracticeQuestions(practiceSetId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.practice.questions(practiceSetId ?? ""),
    queryFn: () => fetchPracticeQuestions(practiceSetId!),
    enabled: !!practiceSetId,
    staleTime: STALE_TIMES.ASSIGNMENTS,
  });
}

/**
 * Hook to fetch only active (incomplete) practice sets
 */
export function useActivePracticeSets() {
  return useQuery({
    queryKey: queryKeys.practice.list({ status: "active" }),
    queryFn: fetchActivePracticeSets,
    staleTime: STALE_TIMES.ASSIGNMENTS,
  });
}

/**
 * Hook to fetch completed practice sets with scores
 */
export function useCompletedPracticeSets() {
  return useQuery({
    queryKey: queryKeys.practice.list({ status: "completed" }),
    queryFn: fetchCompletedPracticeSets,
    staleTime: STALE_TIMES.PROGRESS,
  });
}

// Re-export types
export type { PracticeSet, PracticeQuestion, PracticeSetWithQuestions };
