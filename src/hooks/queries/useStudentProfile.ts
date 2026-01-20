/**
 * Student Profile Query Hook
 *
 * Fetches and caches the current student's profile data using React Query.
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES } from "@/lib/query";
import { fetchStudentProfile, fetchStudentProfileById } from "@/lib/api/student";
import type { StudentProfile } from "@/lib/api/student";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to fetch the current user's student profile
 */
export function useStudentProfile() {
  return useQuery({
    queryKey: queryKeys.students.profile("me"),
    queryFn: fetchStudentProfile,
    staleTime: STALE_TIMES.USER,
  });
}

/**
 * Hook to fetch a specific student's profile by ID
 */
export function useStudentProfileById(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.students.profile(studentId ?? ""),
    queryFn: () => fetchStudentProfileById(studentId!),
    enabled: !!studentId,
    staleTime: STALE_TIMES.USER,
  });
}

/**
 * Hook to get the current user ID
 */
export function useCurrentUserId() {
  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user?.id ?? null;
    },
    staleTime: STALE_TIMES.USER,
  });
}

// Re-export types
export type { StudentProfile };
