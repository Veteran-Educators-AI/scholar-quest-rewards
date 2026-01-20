/**
 * Student Entity Types
 */

import type { UserId, StudentId, ClassId } from "../utils/branded";

// ============================================================================
// User Roles
// ============================================================================

export type UserRole = "student" | "parent" | "admin" | "teacher";

// ============================================================================
// Student Profile
// ============================================================================

export interface StudentProfile {
  user_id: UserId;
  coins: number;
  xp: number;
  current_streak: number;
  longest_streak: number;
  streak_shield_available: boolean;
  grade_level: number | null;
  math_level: string | null;
  reading_level: string | null;
  skill_tags: string[] | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  accommodations: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudentProfileData {
  coins: number;
  xp: number;
  current_streak: number;
  streak_shield_available: boolean;
  grade_level: number | null;
}

// ============================================================================
// External Student (from NYCologic/GeoBlox)
// ============================================================================

export interface ExternalStudent {
  id: string;
  external_id: string;
  source: "nycologic" | "geoblox" | "manual";
  full_name: string | null;
  email: string | null;
  grade_level: number | null;
  overall_average: number | null;
  grades: unknown[];
  weak_topics: string[];
  misconceptions: string[];
  skill_tags: string[];
  class_name: string | null;
  teacher_name: string | null;
  linked_user_id: UserId | null;
  created_at?: string;
  updated_at?: string;
}

export interface ExternalStudentData {
  full_name: string;
  overall_average: number | null;
  grades: unknown[];
  weak_topics: string[];
  misconceptions: string[];
  class_name: string | null;
  teacher_name: string | null;
}

// ============================================================================
// Enrollment
// ============================================================================

export interface Enrollment {
  id: string;
  student_id: StudentId;
  class_id: ClassId;
  enrolled_at: string;
  created_at?: string;
}

export interface PendingEnrollment {
  id: string;
  class_id: ClassId;
  email: string;
  student_name: string | null;
  teacher_id: UserId;
  processed: boolean;
  created_at?: string;
}

// ============================================================================
// Student Status (for classroom tracking)
// ============================================================================

export type StudentStatusType =
  | "on_task"
  | "off_task"
  | "needs_support"
  | "excellent"
  | "absent"
  | "late";

export interface StudentStatus {
  id: string;
  student_id: StudentId;
  recorded_by: UserId;
  status: StudentStatusType;
  notes: string | null;
  recorded_at: string;
}
