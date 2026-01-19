/**
 * React Query Client Configuration
 *
 * Centralized QueryClient with optimized defaults for the Scholar Quest app.
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Default stale times for different data types
 */
export const STALE_TIMES = {
  /** User profile data - refetch every 5 minutes */
  USER: 5 * 60 * 1000,
  /** Student progress/stats - refetch every 2 minutes */
  PROGRESS: 2 * 60 * 1000,
  /** Assignments list - refetch every 1 minute */
  ASSIGNMENTS: 1 * 60 * 1000,
  /** Static data (badges, standards) - refetch every 30 minutes */
  STATIC: 30 * 60 * 1000,
  /** Real-time data (leaderboard) - always fresh */
  REALTIME: 0,
} as const;

/**
 * Create a configured QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time of 2 minutes
        staleTime: STALE_TIMES.PROGRESS,
        // Keep unused data in cache for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry failed requests up to 2 times
        retry: 2,
        // Don't retry on 4xx errors
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus for fresh data
        refetchOnWindowFocus: true,
        // Don't refetch on reconnect by default
        refetchOnReconnect: "always",
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        // Show error in console for debugging
        onError: (error) => {
          console.error("Mutation error:", error);
        },
      },
    },
  });
}

/**
 * Singleton QueryClient instance
 * Use this in App.tsx for the QueryClientProvider
 */
export const queryClient = createQueryClient();
