-- Migration: Email Verification Enforcement
-- Adds database-level checks for email verification
-- Sensitive operations require confirmed email

-- Function to check if user's email is confirmed
CREATE OR REPLACE FUNCTION public.is_email_confirmed(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE id = _user_id),
    FALSE
  )
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_email_confirmed TO authenticated;

-- Add RLS policy for reward_ledger: only verified users can earn rewards
DROP POLICY IF EXISTS "Students can view own rewards" ON public.reward_ledger;

CREATE POLICY "Verified students can view own rewards"
ON public.reward_ledger
FOR SELECT
USING (
  auth.uid() = student_id
  AND public.is_email_confirmed(auth.uid())
);

-- Add RLS policy for student_badges: only verified users can view badges
DROP POLICY IF EXISTS "Students can view own badges" ON public.student_badges;

CREATE POLICY "Verified students can view own badges"
ON public.student_badges
FOR SELECT
USING (
  auth.uid() = student_id
  AND public.is_email_confirmed(auth.uid())
);

-- Add RLS policy for student_collectibles: only verified users can view
DROP POLICY IF EXISTS "Students can view own collectibles" ON public.student_collectibles;

CREATE POLICY "Verified students can view own collectibles"
ON public.student_collectibles
FOR SELECT
USING (
  auth.uid() = student_id
  AND public.is_email_confirmed(auth.uid())
);

-- Note: Basic profile access is still allowed for unverified users
-- so they can see the verification pending page
-- The verification requirement is enforced at the application layer
-- via useAuthRedirect for route protection
