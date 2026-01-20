/**
 * Branded Types
 *
 * Similar to C++ strong typedefs - compile-time type safety for IDs.
 * Prevents accidentally passing a StudentId where an AssignmentId is expected.
 */

declare const brand: unique symbol;

/**
 * Brand a primitive type to make it nominally typed.
 *
 * @example
 * type UserId = Brand<string, "UserId">;
 * const userId = "abc-123" as UserId;
 * const assignmentId = "xyz-456" as AssignmentId;
 * // userId !== assignmentId at type level, even though both are strings
 */
export type Brand<T, B> = T & { readonly [brand]: B };

// ============================================================================
// ID Types
// ============================================================================

export type UserId = Brand<string, "UserId">;
export type StudentId = Brand<string, "StudentId">;
export type TeacherId = Brand<string, "TeacherId">;
export type ParentId = Brand<string, "ParentId">;
export type AdminId = Brand<string, "AdminId">;

export type ClassId = Brand<string, "ClassId">;
export type AssignmentId = Brand<string, "AssignmentId">;
export type AttemptId = Brand<string, "AttemptId">;
export type QuestionId = Brand<string, "QuestionId">;

export type PracticeSetId = Brand<string, "PracticeSetId">;
export type PracticeQuestionId = Brand<string, "PracticeQuestionId">;

export type BadgeId = Brand<string, "BadgeId">;
export type RewardClaimId = Brand<string, "RewardClaimId">;
export type PledgeId = Brand<string, "PledgeId">;

export type StandardId = Brand<string, "StandardId">;
export type ExternalStudentId = Brand<string, "ExternalStudentId">;

// ============================================================================
// Type Guards for IDs
// ============================================================================

export function isValidUuid(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function asUserId(value: string): UserId {
  return value as UserId;
}

export function asStudentId(value: string): StudentId {
  return value as StudentId;
}

export function asClassId(value: string): ClassId {
  return value as ClassId;
}

export function asAssignmentId(value: string): AssignmentId {
  return value as AssignmentId;
}

export function asPracticeSetId(value: string): PracticeSetId {
  return value as PracticeSetId;
}

export function asBadgeId(value: string): BadgeId {
  return value as BadgeId;
}
