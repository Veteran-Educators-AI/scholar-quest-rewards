/**
 * Type Guards
 *
 * Runtime type checking utilities for safer type narrowing.
 */

import type { UserRole, QuestionType, AttemptStatus, AssignmentStatus } from "../entities";

// ============================================================================
// Role Guards
// ============================================================================

const USER_ROLES = ["student", "parent", "admin", "teacher"] as const;

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function isStudent(role: UserRole | undefined): role is "student" {
  return role === "student";
}

export function isTeacher(role: UserRole | undefined): role is "teacher" {
  return role === "teacher";
}

export function isParent(role: UserRole | undefined): role is "parent" {
  return role === "parent";
}

export function isAdmin(role: UserRole | undefined): role is "admin" {
  return role === "admin";
}

// ============================================================================
// Question Type Guards
// ============================================================================

const QUESTION_TYPES = [
  "multiple_choice",
  "short_answer",
  "numeric",
  "drag_order",
  "matching",
  "fill_blank",
] as const;

export function isQuestionType(value: unknown): value is QuestionType {
  return typeof value === "string" && QUESTION_TYPES.includes(value as QuestionType);
}

// ============================================================================
// Status Guards
// ============================================================================

const ATTEMPT_STATUSES = [
  "not_started",
  "in_progress",
  "submitted",
  "verified",
  "rejected",
] as const;

export function isAttemptStatus(value: unknown): value is AttemptStatus {
  return typeof value === "string" && ATTEMPT_STATUSES.includes(value as AttemptStatus);
}

const ASSIGNMENT_STATUSES = ["pending", "active", "completed", "archived"] as const;

export function isAssignmentStatus(value: unknown): value is AssignmentStatus {
  return typeof value === "string" && ASSIGNMENT_STATUSES.includes(value as AssignmentStatus);
}

// ============================================================================
// Data Structure Guards
// ============================================================================

export function isNonEmptyArray<T>(value: T[] | null | undefined): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

export function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isNonNullObject(obj) && key in obj;
}

// ============================================================================
// Score Guards
// ============================================================================

export function isPassingScore(score: number | null | undefined, threshold = 70): boolean {
  return typeof score === "number" && score >= threshold;
}

export function isValidScore(score: unknown): score is number {
  return typeof score === "number" && score >= 0 && score <= 100 && !isNaN(score);
}
