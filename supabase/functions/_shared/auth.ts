/**
 * Authentication utilities for edge functions.
 * Provides consistent token extraction and validation.
 */

import { SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Extracts Bearer token from Authorization header.
 *
 * @param req - Incoming request
 * @returns Token string or null if not present
 */
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return null;
  }

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice(7); // Remove "Bearer " prefix
}

/**
 * Extracts API key from x-api-key header.
 *
 * @param req - Incoming request
 * @returns API key string or null if not present
 */
export function extractApiKey(req: Request): string | null {
  return req.headers.get("x-api-key");
}

/**
 * Validates a Bearer token and returns the user.
 *
 * @param supabase - Supabase client
 * @param token - Bearer token to validate
 * @returns User object if valid
 * @throws Error if token is invalid or user not found
 */
export async function validateBearerToken(
  supabase: SupabaseClient,
  token: string
): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error) {
    throw new Error(`Token validation failed: ${error.message}`);
  }

  if (!user) {
    throw new Error("User not found for token");
  }

  return user;
}

/**
 * Hashes an API key using SHA-256.
 * Used for secure storage and comparison of API keys.
 *
 * @param apiKey - Plain text API key
 * @returns Hex-encoded SHA-256 hash
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Integration token data from database.
 */
export interface IntegrationToken {
  id: string;
  token_hash: string;
  source_app: string;
  is_active: boolean;
  scopes: string[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  last_used_at: string | null;
}

/**
 * Validates an API key against the integration_tokens table.
 * Uses SHA-256 hashing for secure comparison.
 *
 * @param supabase - Supabase client
 * @param apiKey - Plain text API key to validate
 * @returns Integration token data if valid
 * @throws Error if token is invalid or inactive
 */
export async function validateApiKey(
  supabase: SupabaseClient,
  apiKey: string
): Promise<IntegrationToken> {
  const tokenHash = await hashApiKey(apiKey);

  const { data: tokenData, error: tokenError } = await supabase
    .from("integration_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .eq("is_active", true)
    .single();

  if (tokenError || !tokenData) {
    throw new Error("Invalid or inactive API key");
  }

  // Update last_used_at timestamp
  await supabase
    .from("integration_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", tokenData.id);

  return tokenData as IntegrationToken;
}

/**
 * Validates that a token has the required scope.
 *
 * @param token - Integration token
 * @param requiredScope - Scope to check for
 * @returns true if token has the scope or has no scope restrictions
 */
export function hasScope(token: IntegrationToken, requiredScope: string): boolean {
  // No scopes means full access
  if (!token.scopes || token.scopes.length === 0) {
    return true;
  }

  return token.scopes.includes(requiredScope);
}

/**
 * Simple API key validation against environment variable.
 * Used for simple webhook endpoints (e.g., GeoBlox).
 *
 * @param apiKey - API key from request
 * @param envVarName - Name of environment variable containing expected key
 * @returns true if keys match
 */
export function validateSimpleApiKey(
  apiKey: string | null,
  envVarName: string
): boolean {
  const expectedKey = Deno.env.get(envVarName);
  if (!expectedKey || !apiKey) {
    return false;
  }

  // Timing-safe comparison to prevent timing attacks
  if (apiKey.length !== expectedKey.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < apiKey.length; i++) {
    result |= apiKey.charCodeAt(i) ^ expectedKey.charCodeAt(i);
  }

  return result === 0;
}
