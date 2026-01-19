/**
 * Main entry point for shared edge function utilities.
 * Re-exports all modules for convenient importing.
 *
 * Usage:
 * ```typescript
 * import {
 *   createHandler,
 *   requireAuth,
 *   createSuccessResponse,
 *   AwardRewardsRequestSchema,
 * } from "../_shared/index.ts";
 * ```
 */

// CORS utilities
export {
  corsHeaders,
  corsHeadersWithApiKey,
  corsHeadersFull,
  handleCors,
  isOptionsRequest,
  type CorsHeaders,
} from "./cors.ts";

// Supabase client utilities
export {
  createServiceClient,
  createAnonClient,
  createAuthenticatedClient,
  AuthenticationError,
  type AuthenticatedClientResult,
  type SupabaseClient,
  type User,
} from "./supabase-client.ts";

// Authentication utilities
export {
  extractBearerToken,
  extractApiKey,
  validateBearerToken,
  hashApiKey,
  validateApiKey,
  validateSimpleApiKey,
  hasScope,
  type IntegrationToken,
} from "./auth.ts";

// Response utilities
export {
  createSuccessResponse,
  createErrorResponse,
  createUnauthorizedResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createInternalErrorResponse,
  createRateLimitResponse,
  createPaymentRequiredResponse,
  isSuccessResponse,
  isErrorResponse,
  type ApiResponse,
  type ResponseMeta,
} from "./response.ts";

// Error utilities
export {
  AppError,
  validationError,
  notFoundError,
  unauthorizedError,
  forbiddenError,
  isAppError,
  toAppError,
  getHttpStatus,
  ERROR_MESSAGES,
  type ErrorCode,
} from "./errors.ts";

// Constants
export {
  THRESHOLDS,
  REWARDS,
  LIMITS,
  CLAIM_TYPES,
  QUESTION_TYPES,
  MASTERY_LEVELS,
  XP_PER_LEVEL,
  FEEDBACK_MESSAGES,
  SOURCE_APPS,
  AI_GATEWAY,
  calculateLevel,
  calculateLevelProgress,
  getFeedbackMessage,
  type ClaimType,
  type QuestionType,
  type MasteryLevel,
  type SourceApp,
} from "./constants.ts";

// Middleware utilities
export {
  createHandler,
  createContext,
  compose,
  requireAuth,
  requireApiKey,
  requireSimpleApiKey,
  parseBody,
  logRequest,
  requireMethod,
  authMiddleware,
  apiKeyMiddleware,
  withBodyValidation,
  type Middleware,
  type MiddlewareContext,
  type RequestHandler,
} from "./middleware.ts";

// AI Gateway utilities
export {
  createChatCompletion,
  extractJson,
  createSystemPrompt,
  gradeShortAnswer,
  SYSTEM_PROMPTS,
  type AiMessage,
  type AiCompletionOptions,
  type AiCompletionResponse,
  type GradingResult,
} from "./ai-gateway.ts";

// Type validation (Zod schemas)
export * from "./types/index.ts";
