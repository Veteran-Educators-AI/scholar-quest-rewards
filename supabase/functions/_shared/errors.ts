/**
 * Error codes and handling utilities for edge functions.
 * Provides consistent error taxonomy across all endpoints.
 */

/**
 * Standard error codes for API responses.
 * Use these codes for programmatic error handling.
 */
export type ErrorCode =
  // Authentication errors (401)
  | "UNAUTHORIZED"
  | "INVALID_TOKEN"
  | "TOKEN_EXPIRED"
  | "INVALID_API_KEY"
  // Authorization errors (403)
  | "FORBIDDEN"
  | "INSUFFICIENT_PERMISSIONS"
  | "SCOPE_REQUIRED"
  // Validation errors (400)
  | "VALIDATION_ERROR"
  | "INVALID_REQUEST"
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_FORMAT"
  // Resource errors (404, 409)
  | "NOT_FOUND"
  | "ALREADY_EXISTS"
  | "ALREADY_CLAIMED"
  | "CONFLICT"
  // Business logic errors (400, 422)
  | "THRESHOLD_NOT_MET"
  | "REWARDS_EXCEED_LIMIT"
  | "NOT_COMPLETED"
  | "INVALID_STATE"
  // Rate limiting (429)
  | "RATE_LIMITED"
  // Payment (402)
  | "CREDITS_EXHAUSTED"
  // Server errors (500, 503)
  | "INTERNAL_ERROR"
  | "DATABASE_ERROR"
  | "EXTERNAL_SERVICE_ERROR"
  | "SERVICE_UNAVAILABLE";

/**
 * Default error messages for each error code.
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Authentication
  UNAUTHORIZED: "Authentication required",
  INVALID_TOKEN: "Invalid or malformed token",
  TOKEN_EXPIRED: "Token has expired",
  INVALID_API_KEY: "Invalid or inactive API key",
  // Authorization
  FORBIDDEN: "Access denied",
  INSUFFICIENT_PERMISSIONS: "Insufficient permissions for this operation",
  SCOPE_REQUIRED: "Required scope not present on token",
  // Validation
  VALIDATION_ERROR: "Request validation failed",
  INVALID_REQUEST: "Invalid request format",
  MISSING_REQUIRED_FIELD: "Required field is missing",
  INVALID_FORMAT: "Field format is invalid",
  // Resources
  NOT_FOUND: "Resource not found",
  ALREADY_EXISTS: "Resource already exists",
  ALREADY_CLAIMED: "Reward has already been claimed",
  CONFLICT: "Operation conflicts with current state",
  // Business logic
  THRESHOLD_NOT_MET: "Score does not meet the required threshold",
  REWARDS_EXCEED_LIMIT: "Requested rewards exceed maximum allowed",
  NOT_COMPLETED: "Resource is not in completed state",
  INVALID_STATE: "Resource is in an invalid state for this operation",
  // Rate limiting
  RATE_LIMITED: "Too many requests. Please try again later",
  // Payment
  CREDITS_EXHAUSTED: "AI credits exhausted",
  // Server
  INTERNAL_ERROR: "An internal error occurred",
  DATABASE_ERROR: "Database operation failed",
  EXTERNAL_SERVICE_ERROR: "External service request failed",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",
};

/**
 * Maps error codes to HTTP status codes.
 */
const HTTP_STATUS_MAP: Record<ErrorCode, number> = {
  // 401
  UNAUTHORIZED: 401,
  INVALID_TOKEN: 401,
  TOKEN_EXPIRED: 401,
  INVALID_API_KEY: 401,
  // 403
  FORBIDDEN: 403,
  INSUFFICIENT_PERMISSIONS: 403,
  SCOPE_REQUIRED: 403,
  // 400
  VALIDATION_ERROR: 400,
  INVALID_REQUEST: 400,
  MISSING_REQUIRED_FIELD: 400,
  INVALID_FORMAT: 400,
  THRESHOLD_NOT_MET: 400,
  REWARDS_EXCEED_LIMIT: 400,
  NOT_COMPLETED: 400,
  INVALID_STATE: 400,
  // 404
  NOT_FOUND: 404,
  // 409
  ALREADY_EXISTS: 409,
  ALREADY_CLAIMED: 409,
  CONFLICT: 409,
  // 429
  RATE_LIMITED: 429,
  // 402
  CREDITS_EXHAUSTED: 402,
  // 500
  INTERNAL_ERROR: 500,
  DATABASE_ERROR: 500,
  EXTERNAL_SERVICE_ERROR: 502,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Gets the HTTP status code for an error code.
 *
 * @param code - Error code
 * @returns HTTP status code
 */
export function getHttpStatus(code: ErrorCode): number {
  return HTTP_STATUS_MAP[code];
}

/**
 * Custom error class with error code.
 * Enables structured error handling in edge functions.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(code: ErrorCode, message?: string, details?: unknown) {
    super(message ?? ERROR_MESSAGES[code]);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }

  /**
   * Gets the HTTP status for this error.
   */
  get status(): number {
    return getHttpStatus(this.code);
  }
}

/**
 * Creates an AppError for validation failures.
 *
 * @param message - Error message
 * @param details - Validation error details (e.g., Zod errors)
 * @returns AppError instance
 */
export function validationError(message: string, details?: unknown): AppError {
  return new AppError("VALIDATION_ERROR", message, details);
}

/**
 * Creates an AppError for not found resources.
 *
 * @param resource - Name of resource that wasn't found
 * @returns AppError instance
 */
export function notFoundError(resource: string): AppError {
  return new AppError("NOT_FOUND", `${resource} not found`);
}

/**
 * Creates an AppError for unauthorized access.
 *
 * @param message - Optional custom message
 * @returns AppError instance
 */
export function unauthorizedError(message?: string): AppError {
  return new AppError("UNAUTHORIZED", message);
}

/**
 * Creates an AppError for forbidden access.
 *
 * @param message - Optional custom message
 * @returns AppError instance
 */
export function forbiddenError(message?: string): AppError {
  return new AppError("FORBIDDEN", message);
}

/**
 * Type guard to check if an error is an AppError.
 *
 * @param error - Error to check
 * @returns true if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Converts any error to an AppError.
 * Unknown errors become INTERNAL_ERROR.
 *
 * @param error - Error to convert
 * @returns AppError instance
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes("authentication") || error.message.includes("auth")) {
      return new AppError("UNAUTHORIZED", error.message);
    }
    if (error.message.includes("not found")) {
      return new AppError("NOT_FOUND", error.message);
    }

    return new AppError("INTERNAL_ERROR", error.message);
  }

  return new AppError("INTERNAL_ERROR", String(error));
}
