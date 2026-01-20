/**
 * GeoBlox Access Query Hook
 *
 * Fetches and caches geometry mastery data for GeoBlox unlock status.
 * Replaces the old useEffect-based useGeobloxAccess hook.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES } from "@/lib/query";
import { fetchGeometryMastery } from "@/lib/api/student";
import type { GeometryMastery } from "@/lib/api/student";
import { GEOBLOX_UNLOCK_THRESHOLD } from "@/constants";

/**
 * Hook to fetch GeoBlox access status based on geometry mastery
 */
export function useGeobloxAccess() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.geoblox.mastery("me"),
    queryFn: fetchGeometryMastery,
    staleTime: STALE_TIMES.PROGRESS,
  });

  // Compute derived values
  const mastery = query.data;

  const isUnlocked = mastery?.geoblox_unlocked ?? false;

  const progressToUnlock = mastery
    ? Math.min(100, (mastery.mastery_percentage / GEOBLOX_UNLOCK_THRESHOLD) * 100)
    : 0;

  const questionsNeeded =
    mastery && mastery.mastery_percentage < GEOBLOX_UNLOCK_THRESHOLD
      ? Math.max(
          0,
          Math.ceil(
            (0.7 * (mastery.questions_attempted + 10) - mastery.questions_correct) /
              0.7
          )
        )
      : 0;

  // Manual refresh function
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.geoblox.mastery("me") });
  };

  return {
    // Query state
    loading: query.isLoading,
    isLoading: query.isLoading,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,

    // Data
    mastery,
    isUnlocked,
    progressToUnlock,
    questionsNeeded,

    // Actions
    refresh,
    refetch: query.refetch,
  };
}

// Re-export types
export type { GeometryMastery };
