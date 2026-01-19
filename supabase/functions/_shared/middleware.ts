/**
 * Composable middleware for edge functions.
 * allows building request handling pipelines from reusable pieces.
 */

import { SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors, isOptionsRequest, CorsHeaders } from "./cors.ts";
import { createServiceClient, AuthenticationError } from "./supabase-client.ts";
import {
  extractBearerToken,
  extractApiKey,
  validateBearerToken,
  validateApiKey,
  validateSimpleApiKey,
  IntegrationToken,
} from "./auth.ts";
import {
  createErrorResponse,
  createUnauthorizedResponse,
  createValidationErrorResponse,
  createInternalErrorResponse,
} from "./response.ts";
import { AppError, isAppError, toAppError } from "./errors.ts";
import { safeValidateRequest, formatZodErrors } from "./types/validation.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

/**
 * Context passed through middleware chain.
 * Accumulated state from previous middleware steps.
 */
export interface MiddlewareContext {
  /** Supabase client (service role) */
  supabase: SupabaseClient;
  /** Authenticated user (if auth middleware ran) */
  user?: User;
  /** API token data (if API key middleware ran) */
  apiToken?: IntegrationToken;
  /** Unique request ID for tracing */
  requestId: string;
  /** Parsed request body (if body middleware ran) */
  body?: unknown;
  /** CORS headers to use */
  corsHeaders: CorsHeaders;
}

/**
 * Middleware function type.
 * Returns Response to short-circuit, or null to continue chain.
 */
export type Middleware = (
  req: Request,
  ctx: MiddlewareContext
) => Promise<Response | null>;

/**
 * Request handler function type.
 * Called after all middleware passes.
 */
export type RequestHandler = (
  req: Request,
  ctx: MiddlewareContext
) => Promise<Response>;

/**
 * Generates a unique request ID.
 */
function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Creates initial middleware context.
 *
 * @param cors - CORS headers to use
 * @returns Initial context
 */
export function createContext(cors: CorsHeaders = corsHeaders): MiddlewareContext {
  return {
    supabase: createServiceClient(),
    requestId: generateRequestId(),
    corsHeaders: cors,
  };
}

/**
 * Composes multiple middleware functions into a single function.
 * Similar to C++ template variadic composition.
 *
 * @param middlewares - Middleware functions to compose
 * @returns Composed middleware
 */
export function compose(...middlewares: Middleware[]): Middleware {
  return async (req: Request, ctx: MiddlewareContext): Promise<Response | null> => {
    for (const middleware of middlewares) {
      const result = await middleware(req, ctx);
      if (result) {
        return result; // Short-circuit on response
      }
    }
    return null; // All middleware passed
  };
}

/**
 * Creates an edge function handler with middleware support.
 *
 * @param handler - Request handler function
 * @param options - Handler options
 * @returns Deno.serve compatible handler
 */
export function createHandler(
  handler: RequestHandler,
  options: {
    middleware?: Middleware[];
    cors?: CorsHeaders;
  } = {}
): (req: Request) => Promise<Response> {
  const { middleware = [], cors = corsHeaders } = options;

  return async (req: Request): Promise<Response> => {
    // Handle CORS preflight
    if (isOptionsRequest(req)) {
      return handleCors(cors);
    }

    const ctx = createContext(cors);

    try {
      // Run middleware chain
      if (middleware.length > 0) {
        const composed = compose(...middleware);
        const middlewareResponse = await composed(req, ctx);
        if (middlewareResponse) {
          return middlewareResponse;
        }
      }

      // Run handler
      return await handler(req, ctx);
    } catch (error) {
      return handleError(error, ctx);
    }
  };
}

/**
 * Handles errors and returns appropriate response.
 *
 * @param error - Error to handle
 * @param ctx - Middleware context
 * @returns Error response
 */
function handleError(error: unknown, ctx: MiddlewareContext): Response {
  const appError = toAppError(error);
  console.error(`[${ctx.requestId}] Error:`, appError.message);

  return createErrorResponse(
    appError.code,
    appError.message,
    {
      details: appError.details,
      cors: ctx.corsHeaders,
    }
  );
}

// ============================================================================
// Pre-built Middleware
// ============================================================================

/**
 * Middleware that requires Bearer token authentication.
 * Sets ctx.user on success.
 */
export const requireAuth: Middleware = async (req, ctx) => {
  const token = extractBearerToken(req);

  if (!token) {
    return createUnauthorizedResponse(
      "No authorization header provided",
      ctx.corsHeaders
    );
  }

  try {
    ctx.user = await validateBearerToken(ctx.supabase, token);
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    return createUnauthorizedResponse(message, ctx.corsHeaders);
  }
};

/**
 * Creates middleware that requires API key authentication.
 * Validates against integration_tokens table.
 * Sets ctx.apiToken on success.
 *
 * @param requiredScope - Optional scope to require
 */
export function requireApiKey(requiredScope?: string): Middleware {
  return async (req, ctx) => {
    const apiKey = extractApiKey(req);

    if (!apiKey) {
      return createUnauthorizedResponse(
        "No API key provided",
        ctx.corsHeaders
      );
    }

    try {
      const token = await validateApiKey(ctx.supabase, apiKey);

      if (requiredScope && token.scopes && !token.scopes.includes(requiredScope)) {
        return createErrorResponse(
          "SCOPE_REQUIRED",
          `Required scope '${requiredScope}' not present`,
          { cors: ctx.corsHeaders }
        );
      }

      ctx.apiToken = token;
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid API key";
      return createUnauthorizedResponse(message, ctx.corsHeaders);
    }
  };
}

/**
 * Creates middleware that validates API key against environment variable.
 * For simple webhook endpoints.
 *
 * @param envVarName - Name of environment variable with expected key
 */
export function requireSimpleApiKey(envVarName: string): Middleware {
  return async (req, ctx) => {
    const apiKey = extractApiKey(req);

    if (!validateSimpleApiKey(apiKey, envVarName)) {
      return createUnauthorizedResponse("Unauthorized", ctx.corsHeaders);
    }

    return null;
  };
}

/**
 * Creates middleware that parses and validates JSON body.
 * Sets ctx.body on success.
 *
 * @param schema - Zod schema to validate against
 */
export function parseBody<T extends z.ZodType>(schema: T): Middleware {
  return async (req, ctx) => {
    let rawBody: unknown;

    try {
      rawBody = await req.json();
    } catch {
      return createValidationErrorResponse(
        "Invalid JSON body",
        undefined,
        ctx.corsHeaders
      );
    }

    const result = safeValidateRequest(schema, rawBody);

    if (!result.success) {
      return createValidationErrorResponse(
        "Request validation failed",
        formatZodErrors(result.error),
        ctx.corsHeaders
      );
    }

    ctx.body = result.data;
    return null;
  };
}

/**
 * Middleware that logs request details.
 */
export const logRequest: Middleware = async (req, ctx) => {
  const url = new URL(req.url);
  console.log(`[${ctx.requestId}] ${req.method} ${url.pathname}`);
  return null;
};

/**
 * Creates middleware that requires specific HTTP method.
 *
 * @param method - Required HTTP method
 */
export function requireMethod(method: string): Middleware {
  return async (req, ctx) => {
    if (req.method !== method) {
      return createErrorResponse(
        "INVALID_REQUEST",
        `Method ${req.method} not allowed`,
        { status: 405, cors: ctx.corsHeaders }
      );
    }
    return null;
  };
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Standard middleware stack for authenticated endpoints.
 */
export const authMiddleware: Middleware[] = [logRequest, requireAuth];

/**
 * Standard middleware stack for API key endpoints.
 */
export const apiKeyMiddleware: Middleware[] = [logRequest, requireApiKey()];

/**
 * Creates middleware stack with body validation.
 *
 * @param schema - Zod schema for body validation
 * @param auth - Authentication middleware to use
 */
export function withBodyValidation<T extends z.ZodType>(
  schema: T,
  auth: Middleware = requireAuth
): Middleware[] {
  return [logRequest, auth, parseBody(schema)];
}
