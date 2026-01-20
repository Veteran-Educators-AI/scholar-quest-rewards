/**
 * Query Key Factory
 *
 * Type-safe query keys following the factory pattern recommended by TanStack Query.
 * This ensures consistent key structure and enables efficient cache invalidation.
 *
 * @example
 * // Fetch student profile
 * useQuery({ queryKey: queryKeys.students.profile(studentId) })
 *
 * // Invalidate all student data
 * queryClient.invalidateQueries({ queryKey: queryKeys.students.all })
 *
 * // Invalidate specific student
 * queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(studentId) })
 */

// ============================================================================
// Student Keys
// ============================================================================

export const studentKeys = {
  all: ["students"] as const,
  lists: () => [...studentKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, "detail"] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
  profile: (id: string) => [...studentKeys.detail(id), "profile"] as const,
  progress: (id: string) => [...studentKeys.detail(id), "progress"] as const,
  stats: (id: string) => [...studentKeys.detail(id), "stats"] as const,
};

// ============================================================================
// Assignment Keys
// ============================================================================

export interface AssignmentFilters {
  status?: "pending" | "active" | "completed" | "archived";
  subject?: string;
  classId?: string;
}

export const assignmentKeys = {
  all: ["assignments"] as const,
  lists: () => [...assignmentKeys.all, "list"] as const,
  list: (filters?: AssignmentFilters) =>
    [...assignmentKeys.lists(), filters ?? {}] as const,
  details: () => [...assignmentKeys.all, "detail"] as const,
  detail: (id: string) => [...assignmentKeys.details(), id] as const,
  attempts: (assignmentId: string) =>
    [...assignmentKeys.detail(assignmentId), "attempts"] as const,
  attempt: (assignmentId: string, attemptId: string) =>
    [...assignmentKeys.attempts(assignmentId), attemptId] as const,
};

// ============================================================================
// Practice Keys
// ============================================================================

export interface PracticeFilters {
  subject?: string;
  status?: string;
  skillTags?: string[];
}

export const practiceKeys = {
  all: ["practice"] as const,
  lists: () => [...practiceKeys.all, "list"] as const,
  list: (filters?: PracticeFilters) =>
    [...practiceKeys.lists(), filters ?? {}] as const,
  details: () => [...practiceKeys.all, "detail"] as const,
  detail: (id: string) => [...practiceKeys.details(), id] as const,
  questions: (practiceId: string) =>
    [...practiceKeys.detail(practiceId), "questions"] as const,
};

// ============================================================================
// Rewards Keys
// ============================================================================

export const rewardKeys = {
  all: ["rewards"] as const,
  claims: () => [...rewardKeys.all, "claims"] as const,
  claim: (claimType: string, referenceId: string) =>
    [...rewardKeys.claims(), claimType, referenceId] as const,
  badges: () => [...rewardKeys.all, "badges"] as const,
  badge: (id: string) => [...rewardKeys.badges(), id] as const,
  pledges: () => [...rewardKeys.all, "pledges"] as const,
  collectibles: () => [...rewardKeys.all, "collectibles"] as const,
};

// ============================================================================
// Geoblox Keys
// ============================================================================

export const geobloxKeys = {
  all: ["geoblox"] as const,
  mastery: (studentId: string) =>
    [...geobloxKeys.all, "mastery", studentId] as const,
  access: (studentId: string) =>
    [...geobloxKeys.all, "access", studentId] as const,
  progress: (studentId: string) =>
    [...geobloxKeys.all, "progress", studentId] as const,
};

// ============================================================================
// Leaderboard Keys
// ============================================================================

export interface LeaderboardFilters {
  period?: "daily" | "weekly" | "monthly" | "all-time";
  classId?: string;
  gradeLevel?: number;
}

export const leaderboardKeys = {
  all: ["leaderboard"] as const,
  list: (filters?: LeaderboardFilters) =>
    [...leaderboardKeys.all, filters ?? {}] as const,
};

// ============================================================================
// Challenge Keys
// ============================================================================

export const challengeKeys = {
  all: ["challenges"] as const,
  active: () => [...challengeKeys.all, "active"] as const,
  detail: (id: string) => [...challengeKeys.all, id] as const,
  progress: (id: string) => [...challengeKeys.detail(id), "progress"] as const,
};

// ============================================================================
// Class Keys
// ============================================================================

export const classKeys = {
  all: ["classes"] as const,
  lists: () => [...classKeys.all, "list"] as const,
  list: (teacherId?: string) => [...classKeys.lists(), teacherId ?? "all"] as const,
  details: () => [...classKeys.all, "detail"] as const,
  detail: (id: string) => [...classKeys.details(), id] as const,
  students: (classId: string) => [...classKeys.detail(classId), "students"] as const,
  standards: (classId: string) => [...classKeys.detail(classId), "standards"] as const,
};

// ============================================================================
// Auth Keys
// ============================================================================

export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
  session: () => [...authKeys.all, "session"] as const,
};

// ============================================================================
// Notification Keys
// ============================================================================

export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
  unread: () => [...notificationKeys.all, "unread"] as const,
  detail: (id: string) => [...notificationKeys.all, id] as const,
};

// ============================================================================
// Unified Query Keys Export
// ============================================================================

export const queryKeys = {
  students: studentKeys,
  assignments: assignmentKeys,
  practice: practiceKeys,
  rewards: rewardKeys,
  geoblox: geobloxKeys,
  leaderboard: leaderboardKeys,
  challenges: challengeKeys,
  classes: classKeys,
  auth: authKeys,
  notifications: notificationKeys,
} as const;
