/**
 * Grade Assignment Hook
 *
 * This hook has been migrated to React Query for better caching and state management.
 * Re-exported for backwards compatibility - existing imports will continue to work.
 *
 * @example
 * // Both imports work the same way:
 * import { useGradeAssignment } from "@/hooks/useGradeAssignment";
 * import { useGradeAssignment } from "@/hooks/mutations";
 */

export {
  useGradeAssignment,
  useGradeAssignmentMutation,
  type GradeResult,
  type GradeParams,
} from "./mutations/useGradeAssignment";
