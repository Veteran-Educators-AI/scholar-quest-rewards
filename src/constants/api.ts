/**
 * API Constants
 *
 * Endpoints, limits, and configuration values for API calls.
 */

// ============================================================================
// External APIs
// ============================================================================

export const GEOBLOX_API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scholar-sync`;

export const AI_GATEWAY_URL = import.meta.env.VITE_AI_GATEWAY_URL || "https://ai.gateway.lovable.dev/v1/chat/completions";

export const BREVO_API_URL = import.meta.env.VITE_BREVO_API_URL || "https://api.brevo.com/v3/smtp/email";

// ============================================================================
// Rate Limits
// ============================================================================

export const RATE_LIMITS = {
  /** Maximum API calls per minute for standard endpoints */
  STANDARD: 60,
  /** Maximum API calls per minute for AI endpoints */
  AI_ENDPOINT: 10,
  /** Maximum bulk operations per request */
  BULK_LIMIT: 100,
} as const;

// ============================================================================
// Pagination
// ============================================================================

export const PAGINATION = {
  /** Default page size */
  DEFAULT_PAGE_SIZE: 20,
  /** Maximum page size */
  MAX_PAGE_SIZE: 100,
  /** Default leaderboard limit */
  LEADERBOARD_LIMIT: 50,
} as const;

// ============================================================================
// Invite Link Settings
// ============================================================================

export const INVITE_SETTINGS = {
  /** Default expiration days for invite links */
  DEFAULT_EXPIRES_DAYS: 30,
  /** Token length for invite codes */
  TOKEN_LENGTH: 12,
} as const;

// ============================================================================
// Class Codes
// ============================================================================

export const CLASS_CODE = {
  /** Length of generated class codes */
  LENGTH: 6,
  /** Characters used in class codes */
  CHARACTERS: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
} as const;

// ============================================================================
// Timeouts
// ============================================================================

export const API_TIMEOUTS = {
  /** Default request timeout in ms */
  DEFAULT: 30000,
  /** Long-running operation timeout in ms */
  LONG: 60000,
  /** External API fetch timeout in ms */
  EXTERNAL_FETCH: 10000,
  /** NYCologic API timeout in ms */
  NYCOLOGIC: 15000,
} as const;
