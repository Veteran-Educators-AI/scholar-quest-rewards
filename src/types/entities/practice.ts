/**
 * Practice Set Entity Types
 */

import type { PracticeSetId, PracticeQuestionId, UserId, StandardId } from "../utils/branded";
import type { QuestionType, AnswerKey } from "./assignment";

// ============================================================================
// Practice Set
// ============================================================================

export type PracticeSetStatus = "not_started" | "in_progress" | "completed";

export interface PracticeSet {
  id: PracticeSetId;
  student_id: UserId;
  title: string;
  description: string | null;
  subject: string | null;
  standard_id: StandardId | null;
  skill_tags: string[] | null;
  total_questions: number | null;
  xp_reward: number;
  coin_reward: number;
  score: number | null;
  status: PracticeSetStatus;
  source: "ai_generated" | "teacher_created" | "system";
  started_at: string | null;
  completed_at: string | null;
  created_at?: string;
}

export interface PracticeSetWithQuestions extends PracticeSet {
  questions: PracticeQuestion[];
}

// ============================================================================
// Practice Question
// ============================================================================

export interface PracticeQuestion {
  id: PracticeQuestionId;
  practice_set_id: PracticeSetId;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  answer_key: AnswerKey;
  hint: string | null;
  explanation: string | null;
  skill_tag: string | null;
  difficulty: number;
  order_index: number;
  student_answer: string | null;
  is_correct: boolean | null;
  answered_at: string | null;
}

// ============================================================================
// Practice Filters
// ============================================================================

export interface PracticeFilters {
  subject?: string;
  status?: PracticeSetStatus;
  skillTag?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================================
// Practice Stats
// ============================================================================

export interface PracticeStats {
  totalSets: number;
  completedSets: number;
  averageScore: number;
  totalXpEarned: number;
  totalCoinsEarned: number;
  strongestSkills: string[];
  weakestSkills: string[];
}
