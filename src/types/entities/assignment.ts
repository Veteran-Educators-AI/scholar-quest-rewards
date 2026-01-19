/**
 * Assignment Entity Types
 */

import type { AssignmentId, ClassId, AttemptId, QuestionId, StandardId, UserId } from "../utils/branded";

// ============================================================================
// Assignment Status
// ============================================================================

export type AssignmentStatus = "pending" | "active" | "completed" | "archived";

// ============================================================================
// Assignment
// ============================================================================

export interface Assignment {
  id: AssignmentId;
  class_id: ClassId;
  title: string;
  description: string | null;
  subject: string | null;
  standard_id: StandardId | null;
  due_at: string | null;
  xp_reward: number;
  coin_reward: number;
  status: AssignmentStatus;
  created_at?: string;
  updated_at?: string;
}

export interface AssignmentWithStandard extends Assignment {
  standard?: {
    code: string;
    subject: string;
    domain: string;
    standard_text: string;
  };
}

// ============================================================================
// Attempt
// ============================================================================

export type AttemptMode = "paper" | "in_app";
export type AttemptStatus = "not_started" | "in_progress" | "submitted" | "verified" | "rejected";

export interface Attempt {
  id: AttemptId;
  assignment_id: AssignmentId;
  student_id: UserId;
  mode: AttemptMode;
  status: AttemptStatus;
  score: number | null;
  started_at: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  verified_by: UserId | null;
  feedback: string | null;
  created_at?: string;
}

// ============================================================================
// Question Types
// ============================================================================

export type QuestionType =
  | "multiple_choice"
  | "short_answer"
  | "numeric"
  | "drag_order"
  | "matching"
  | "fill_blank";

export interface Question {
  id: QuestionId;
  assignment_id: AssignmentId;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  answer_key: AnswerKey;
  hint: string | null;
  explanation: string | null;
  points: number;
  order_index: number;
  image_url: string | null;
}

// ============================================================================
// Answer Key Types
// ============================================================================

export type AnswerKey =
  | string // For multiple_choice, short_answer, numeric
  | string[] // For drag_order
  | MatchingPair[]; // For matching

export interface MatchingPair {
  left: string;
  right: string;
}

// ============================================================================
// Quiz Question (for SimpleQuiz component)
// ============================================================================

export interface QuizQuestion {
  id?: string;
  question_text: string;
  question_type: QuestionType;
  options?: string[] | null;
  answer_key: AnswerKey;
  fill_blank_sentence?: string;
  hint?: string | null;
  explanation?: string | null;
}

// ============================================================================
// Grading Result
// ============================================================================

export interface GradingResult {
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  xpEarned: number;
  coinsEarned: number;
  feedback?: string;
}
