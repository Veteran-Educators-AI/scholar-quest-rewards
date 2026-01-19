/**
 * Unified CORS configuration for all edge functions.
 * Eliminates duplication across 19 functions.
 */

/**
 * Standard CORS headers for browser requests.
 * Used by most edge functions for authenticated requests.
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
} as const;

/**
 * Extended CORS headers for webhook/API endpoints.
 * Includes x-api-key header for external integrations.
 */
export const corsHeadersWithApiKey = {
  ...corsHeaders,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
} as const;

/**
 * Full CORS headers including methods.
 * Used for external API endpoints.
 */
export const corsHeadersFull = {
  ...corsHeadersWithApiKey,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
} as const;

/**
 * Handle OPTIONS preflight request.
 * Returns appropriate response for CORS preflight.
 *
 * @param headers - CORS headers to use (defaults to standard headers)
 * @returns Response for OPTIONS request
 */
export function handleCors(
  headers: Record<string, string> = corsHeaders
): Response {
  return new Response(null, { headers });
}

/**
 * Check if request is an OPTIONS preflight request.
 *
 * @param req - Incoming request
 * @returns true if request is OPTIONS method
 */
export function isOptionsRequest(req: Request): boolean {
  return req.method === "OPTIONS";
}

/**
 * Type for CORS header variants
 */
export type CorsHeaders =
  | typeof corsHeaders
  | typeof corsHeadersWithApiKey
  | typeof corsHeadersFull;
