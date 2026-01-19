/**
 * Zod validation schemas for edge functions.
 * Provides runtime validation with compile-time type inference.
 *
 * Pattern: Define schema first, then infer types.
 * This ensures types and validation are always in sync.
 */

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import {
  CLAIM_TYPES,
  QUESTION_TYPES,
  MASTERY_LEVELS,
  LIMITS,
} from "../constants.ts";

// ============================================================================
// Base Schemas (Primitives)
// ============================================================================

/** UUID string validation */
export const UuidSchema = z.string().uuid();

/** Email string validation */
export const EmailSchema = z.string().email();

/** Positive integer validation */
export const PositiveIntSchema = z.number().int().positive();

/** Non-negative integer validation */
export const NonNegativeIntSchema = z.number().int().min(0);

/** Percentage (0-100) validation */
export const PercentageSchema = z.number().min(0).max(100);

// ============================================================================
// Enum Schemas
// ============================================================================

/** Claim type enum schema */
export const ClaimTypeSchema = z.enum([
  CLAIM_TYPES.PRACTICE_SET,
  CLAIM_TYPES.GAME,
  CLAIM_TYPES.STUDY_GOAL,
  CLAIM_TYPES.ASSIGNMENT,
  CLAIM_TYPES.CHALLENGE,
]);

/** Question type enum schema */
export const QuestionTypeSchema = z.enum([
  QUESTION_TYPES.MULTIPLE_CHOICE,
  QUESTION_TYPES.SHORT_ANSWER,
  QUESTION_TYPES.DRAG_ORDER,
  QUESTION_TYPES.MATCHING,
  QUESTION_TYPES.FILL_BLANK,
]);

/** Mastery level enum schema */
export const MasteryLevelSchema = z.enum([
  MASTERY_LEVELS.NOT_STARTED,
  MASTERY_LEVELS.DEVELOPING,
  MASTERY_LEVELS.APPROACHING,
  MASTERY_LEVELS.MASTERED,
]);

// ============================================================================
// Award Rewards Schemas
// ============================================================================

/** Validation data for different claim types */
export const ValidationDataSchema = z
  .object({
    score: z.number().optional(),
    passing_threshold: z.number().optional(),
    questions_answered: NonNegativeIntSchema.optional(),
    correct_answers: NonNegativeIntSchema.optional(),
    time_spent_seconds: NonNegativeIntSchema.optional(),
    goal_index: NonNegativeIntSchema.optional(),
  })
  .optional();

/** Award rewards request schema */
export const AwardRewardsRequestSchema = z.object({
  claim_type: ClaimTypeSchema,
  reference_id: UuidSchema,
  xp_amount: NonNegativeIntSchema.max(LIMITS.MAX_XP_PER_REQUEST),
  coin_amount: NonNegativeIntSchema.max(LIMITS.MAX_COINS_PER_REQUEST),
  reason: z.string().min(1).max(LIMITS.MAX_REASON_LENGTH),
  validation_data: ValidationDataSchema,
});

export type AwardRewardsRequest = z.infer<typeof AwardRewardsRequestSchema>;

// ============================================================================
// Question Schemas
// ============================================================================

/** Matching pair schema */
export const MatchingPairSchema = z.object({
  left: z.string(),
  right: z.string(),
});

/** Answer key schema - varies by question type */
export const AnswerKeySchema = z.union([
  z.string(),
  z.array(z.string()),
  z.array(MatchingPairSchema),
]);

/** Question schema */
export const QuestionSchema = z.object({
  id: UuidSchema,
  prompt: z.string().min(1),
  question_type: QuestionTypeSchema,
  options: z.array(z.string()).max(LIMITS.MAX_OPTIONS_PER_QUESTION).optional(),
  answer_key: AnswerKeySchema,
  fill_blank_sentence: z.string().optional(),
  skill_tag: z.string().optional(),
  hint: z.string().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  examType: z.string().optional(),
});

export type Question = z.infer<typeof QuestionSchema>;

/** Submitted answer schema */
export const SubmittedAnswerSchema = z.object({
  question_id: UuidSchema,
  answer: z.string(),
});

export type SubmittedAnswer = z.infer<typeof SubmittedAnswerSchema>;

// ============================================================================
// Grade Assignment Schemas
// ============================================================================

/** Grade assignment request schema */
export const GradeAssignmentRequestSchema = z.object({
  student_id: UuidSchema,
  assignment_id: UuidSchema,
  attempt_id: UuidSchema.optional(),
  answers: z.array(SubmittedAnswerSchema),
  questions: z.array(QuestionSchema).max(LIMITS.MAX_QUESTIONS_PER_ASSIGNMENT),
  exam_type: z.string().optional(),
});

export type GradeAssignmentRequest = z.infer<typeof GradeAssignmentRequestSchema>;

// ============================================================================
// Practice Set Schemas
// ============================================================================

/** Practice question schema (for webhook) */
export const PracticeQuestionSchema = z.object({
  prompt: z.string().min(1),
  question_type: z.string(),
  options: z.array(z.string()).optional(),
  answer_key: z.unknown(),
  hint: z.string().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  skill_tag: z.string().optional(),
});

/** Practice set data schema (for webhook) */
export const PracticeSetDataSchema = z.object({
  student_id: UuidSchema,
  external_ref: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  skill_tags: z.array(z.string()).optional(),
  questions: z.array(PracticeQuestionSchema).optional(),
  xp_reward: NonNegativeIntSchema.optional(),
  coin_reward: NonNegativeIntSchema.optional(),
});

export type PracticeQuestion = z.infer<typeof PracticeQuestionSchema>;
export type PracticeSetData = z.infer<typeof PracticeSetDataSchema>;

// ============================================================================
// Skill Game Schemas
// ============================================================================

/** Skill game data schema */
export const SkillGameDataSchema = z.object({
  student_id: UuidSchema,
  external_ref: z.string().optional(),
  title: z.string().min(1),
  game_type: z.string(),
  skill_tag: z.string(),
  difficulty: z.number().int().min(1).max(5).optional(),
  game_data: z.record(z.unknown()),
  xp_reward: NonNegativeIntSchema.optional(),
  coin_reward: NonNegativeIntSchema.optional(),
});

export type SkillGameData = z.infer<typeof SkillGameDataSchema>;

// ============================================================================
// Algebra Tutor Schemas
// ============================================================================

/** Tutor request type enum */
export const TutorRequestTypeSchema = z.enum([
  "explain",
  "hint",
  "check",
  "practice",
]);

/** Algebra course enum */
export const AlgebraCourseSchema = z.enum(["Algebra 1", "Algebra 2"]);

/** Algebra tutor request schema */
export const AlgebraTutorRequestSchema = z.object({
  type: TutorRequestTypeSchema,
  topic: z.string().min(1),
  course: AlgebraCourseSchema,
  problem: z.string().optional(),
  studentAnswer: z.string().optional(),
  context: z.string().optional(),
});

export type AlgebraTutorRequest = z.infer<typeof AlgebraTutorRequestSchema>;

// ============================================================================
// Webhook Schemas
// ============================================================================

/** Generic webhook payload schema */
export const WebhookPayloadSchema = z.object({
  action: z.string(),
  data: z.record(z.unknown()),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

/** Mastery update schema (for webhooks) */
export const MasteryUpdateSchema = z.object({
  student_id: UuidSchema,
  standard_code: z.string(),
  mastery_level: MasteryLevelSchema,
  attempts_count: NonNegativeIntSchema,
  correct_count: NonNegativeIntSchema,
});

export type MasteryUpdate = z.infer<typeof MasteryUpdateSchema>;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validates request body against a schema.
 * Returns typed data or throws validation error.
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and typed data
 * @throws ZodError if validation fails
 */
export function validateRequest<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

/**
 * Safely validates request body against a schema.
 * Returns result object instead of throwing.
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Zod SafeParseReturn with success/error info
 */
export function safeValidateRequest<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.SafeParseReturnType<z.input<T>, z.output<T>> {
  return schema.safeParse(data);
}

/**
 * Formats Zod errors into a readable object.
 *
 * @param error - Zod error
 * @returns Formatted error details
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}
