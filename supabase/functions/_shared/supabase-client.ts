/**
 * Supabase client factory for edge functions.
 * Provides type-safe client creation with proper error handling.
 */

import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Environment variable names used by Supabase.
 */
const ENV_KEYS = {
  URL: "SUPABASE_URL",
  SERVICE_KEY: "SUPABASE_SERVICE_ROLE_KEY",
  ANON_KEY: "SUPABASE_ANON_KEY",
} as const;

/**
 * Validates that required environment variables are set.
 * Throws descriptive error if any are missing.
 *
 * @param keys - Array of environment variable names to validate
 * @throws Error if any required variable is missing
 */
function validateEnvVars(keys: string[]): void {
  const missing = keys.filter((key) => !Deno.env.get(key));
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

/**
 * Creates a Supabase client with service role privileges.
 * Use this for server-side operations that bypass RLS.
 *
 * @returns Supabase client with service role
 * @throws Error if required environment variables are missing
 */
export function createServiceClient(): SupabaseClient {
  validateEnvVars([ENV_KEYS.URL, ENV_KEYS.SERVICE_KEY]);

  const supabaseUrl = Deno.env.get(ENV_KEYS.URL)!;
  const supabaseServiceKey = Deno.env.get(ENV_KEYS.SERVICE_KEY)!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Creates a Supabase client with anon key.
 * Use this for client-like operations that respect RLS.
 *
 * @returns Supabase client with anon key
 * @throws Error if required environment variables are missing
 */
export function createAnonClient(): SupabaseClient {
  validateEnvVars([ENV_KEYS.URL, ENV_KEYS.ANON_KEY]);

  const supabaseUrl = Deno.env.get(ENV_KEYS.URL)!;
  const supabaseAnonKey = Deno.env.get(ENV_KEYS.ANON_KEY)!;

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Result of authenticated client creation.
 */
export interface AuthenticatedClientResult {
  supabase: SupabaseClient;
  user: User;
}

/**
 * Creates a Supabase client and validates the user from the request.
 * Combines client creation with authentication in one step.
 *
 * @param req - Incoming request with Authorization header
 * @returns Object containing Supabase client and authenticated user
 * @throws Error if authentication fails or user not found
 */
export async function createAuthenticatedClient(
  req: Request
): Promise<AuthenticatedClientResult> {
  const supabase = createServiceClient();

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new AuthenticationError("No authorization header provided");
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError) {
    throw new AuthenticationError(`Authentication failed: ${authError.message}`);
  }

  if (!user) {
    throw new AuthenticationError("User not found");
  }

  return { supabase, user };
}

/**
 * Custom error for authentication failures.
 * Allows for specific error handling in middleware.
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

/**
 * Re-export types for convenience.
 */
export type { SupabaseClient, User };
