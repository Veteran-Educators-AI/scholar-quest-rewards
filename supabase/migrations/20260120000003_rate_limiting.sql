-- Migration: Rate Limiting for Login
-- Tracks login attempts and enforces lockout after failed attempts
-- Protects against brute force attacks

-- Table to track login attempts
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient lookups by email and time
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time
ON public.login_attempts(email, attempted_at DESC);

-- Index for IP-based lookups
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time
ON public.login_attempts(ip_address, attempted_at DESC);

-- Enable RLS but don't create any policies (no direct access)
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Function to check if login is rate limited
-- Returns: is_allowed, attempts_remaining, lockout_until
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS TABLE(
  is_allowed BOOLEAN,
  attempts_remaining INTEGER,
  lockout_until TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_attempts CONSTANT INTEGER := 5;
  v_lockout_minutes CONSTANT INTEGER := 15;
  v_window_minutes CONSTANT INTEGER := 15;
  v_recent_failures INTEGER;
  v_last_attempt TIMESTAMPTZ;
BEGIN
  -- Count recent failed attempts for this email
  SELECT COUNT(*), MAX(attempted_at)
  INTO v_recent_failures, v_last_attempt
  FROM login_attempts
  WHERE lower(email) = lower(p_email)
    AND success = FALSE
    AND attempted_at > now() - (v_window_minutes || ' minutes')::INTERVAL;

  -- Check if locked out
  IF v_recent_failures >= v_max_attempts THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      0::INTEGER,
      (v_last_attempt + (v_lockout_minutes || ' minutes')::INTERVAL)::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Not locked out
  RETURN QUERY SELECT
    TRUE::BOOLEAN,
    (v_max_attempts - v_recent_failures)::INTEGER,
    NULL::TIMESTAMPTZ;
END;
$$;

-- Function to record a login attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Record the attempt
  INSERT INTO login_attempts (email, ip_address, success)
  VALUES (lower(p_email), p_ip_address, p_success);

  -- If successful login, clear recent failed attempts for this email
  IF p_success THEN
    DELETE FROM login_attempts
    WHERE lower(email) = lower(p_email)
      AND success = FALSE
      AND attempted_at > now() - INTERVAL '15 minutes';
  END IF;

  -- Clean up old attempts (keep 30 days for audit purposes)
  DELETE FROM login_attempts
  WHERE attempted_at < now() - INTERVAL '30 days';
END;
$$;

-- Grant execute permissions to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.record_login_attempt TO authenticated, anon;
