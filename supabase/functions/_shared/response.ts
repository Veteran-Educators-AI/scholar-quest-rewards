/**
 * Type-safe response builders for edge functions.
 * Provides consistent API response format across all endpoints.
 */

import { corsHeaders, CorsHeaders } from "./cors.ts";
import { ErrorCode, ERROR_MESSAGES, getHttpStatus } from "./errors.ts";

/**
 * Standard API response type with discriminated union.
 * Enables exhaustive type checking in consumers.
 */
export type ApiResponse<T> =
  | {
      success: true;
      data: T;
      meta?: {
        timestamp: string;
        requestId?: string;
      };
    }
  | {
      success: false;
      error: {
        code: ErrorCode;
        message: string;
        details?: unknown;
      };
    };

/**
 * Response metadata for successful responses.
 */
export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
}

/**
 * Creates metadata for response.
 *
 * @param requestId - Optional request ID for tracing
 * @returns Response metadata object
 */
function createMeta(requestId?: string): ResponseMeta {
  return {
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
  };
}

/**
 * Creates a successful JSON response.
 *
 * @param data - Response data
 * @param options - Optional configuration
 * @returns HTTP Response object
 */
export function createSuccessResponse<T>(
  data: T,
  options: {
    status?: number;
    headers?: Record<string, string>;
    cors?: CorsHeaders;
    requestId?: string;
  } = {}
): Response {
  const { status = 200, headers = {}, cors = corsHeaders, requestId } = options;

  const body: ApiResponse<T> = {
    success: true,
    data,
    meta: createMeta(requestId),
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * Creates an error JSON response.
 *
 * @param code - Error code from ErrorCode enum
 * @param message - Human-readable error message
 * @param options - Optional configuration
 * @returns HTTP Response object
 */
export function createErrorResponse(
  code: ErrorCode,
  message?: string,
  options: {
    status?: number;
    details?: unknown;
    headers?: Record<string, string>;
    cors?: CorsHeaders;
    requestId?: string;
  } = {}
): Response {
  const {
    status = getHttpStatus(code),
    details,
    headers = {},
    cors = corsHeaders,
    requestId,
  } = options;

  // Log error with request ID for tracing
  if (requestId) {
    console.error(`[${requestId}] Error: ${code} - ${message ?? ERROR_MESSAGES[code]}`);
  }

  const body: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message: message ?? ERROR_MESSAGES[code],
      ...(details !== undefined && { details }),
    },
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * Creates a 401 Unauthorized response.
 *
 * @param message - Optional custom message
 * @param cors - CORS headers to use
 * @returns HTTP Response object
 */
export function createUnauthorizedResponse(
  message?: string,
  cors: CorsHeaders = corsHeaders
): Response {
  return createErrorResponse("UNAUTHORIZED", message, { cors });
}

/**
 * Creates a 400 Bad Request response for validation errors.
 *
 * @param message - Error message
 * @param details - Validation error details
 * @param cors - CORS headers to use
 * @returns HTTP Response object
 */
export function createValidationErrorResponse(
  message: string,
  details?: unknown,
  cors: CorsHeaders = corsHeaders
): Response {
  return createErrorResponse("VALIDATION_ERROR", message, { details, cors });
}

/**
 * Creates a 404 Not Found response.
 *
 * @param resource - Name of resource that wasn't found
 * @param cors - CORS headers to use
 * @returns HTTP Response object
 */
export function createNotFoundResponse(
  resource: string,
  cors: CorsHeaders = corsHeaders
): Response {
  return createErrorResponse("NOT_FOUND", `${resource} not found`, { cors });
}

/**
 * Creates a 500 Internal Server Error response.
 *
 * @param error - Original error (logged but not exposed)
 * @param cors - CORS headers to use
 * @returns HTTP Response object
 */
export function createInternalErrorResponse(
  error: unknown,
  cors: CorsHeaders = corsHeaders
): Response {
  // Log the actual error for debugging
  console.error("Internal error:", error);

  // Return generic message to client
  return createErrorResponse("INTERNAL_ERROR", undefined, { cors });
}

/**
 * Creates a 429 Rate Limit response.
 *
 * @param retryAfter - Seconds until client can retry
 * @param cors - CORS headers to use
 * @returns HTTP Response object
 */
export function createRateLimitResponse(
  retryAfter?: number,
  cors: CorsHeaders = corsHeaders
): Response {
  const headers: Record<string, string> = {};
  if (retryAfter) {
    headers["Retry-After"] = String(retryAfter);
  }

  return createErrorResponse("RATE_LIMITED", undefined, { headers, cors });
}

/**
 * Creates a 402 Payment Required response.
 *
 * @param message - Optional custom message
 * @param cors - CORS headers to use
 * @returns HTTP Response object
 */
export function createPaymentRequiredResponse(
  message?: string,
  cors: CorsHeaders = corsHeaders
): Response {
  return createErrorResponse(
    "CREDITS_EXHAUSTED",
    message ?? "AI credits exhausted. Please add credits to continue.",
    { cors }
  );
}

/**
 * Type guard to check if response is successful.
 *
 * @param response - API response to check
 * @returns true if response is successful
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is Extract<ApiResponse<T>, { success: true }> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error.
 *
 * @param response - API response to check
 * @returns true if response is an error
 */
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is Extract<ApiResponse<T>, { success: false }> {
  return response.success === false;
}
