-- Create a secure function to award rewards that can only be called from edge functions
-- This prevents direct client-side manipulation of XP and coins

-- First, restrict students from directly updating their xp and coins
-- We need to create a more restrictive policy that only allows updating non-reward fields

-- Drop the existing overly permissive update policy for student_profiles if it exists
DROP POLICY IF EXISTS "Users can update their own student profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Students can update own profile" ON public.student_profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.student_profiles;

-- Create a new policy that allows students to update only non-reward fields
-- This excludes xp and coins from being directly updated by students
CREATE POLICY "Students can update non-reward profile fields" ON public.student_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id 
    AND xp = (SELECT xp FROM public.student_profiles WHERE user_id = auth.uid())
    AND coins = (SELECT coins FROM public.student_profiles WHERE user_id = auth.uid())
  );

-- Create a table to track reward claims and prevent double-claiming
CREATE TABLE IF NOT EXISTS public.reward_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  claim_type TEXT NOT NULL, -- 'practice_set', 'game', 'study_goal', 'assignment', etc.
  reference_id TEXT NOT NULL, -- ID of the thing being claimed (practice_set_id, game_id, etc.)
  claim_key TEXT NOT NULL UNIQUE, -- Unique key to prevent double claiming (e.g., student_id:practice_set_id)
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  coins_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reward_claims
ALTER TABLE public.reward_claims ENABLE ROW LEVEL SECURITY;

-- Students can view their own claims
CREATE POLICY "Students can view their own reward claims" ON public.reward_claims
  FOR SELECT
  USING (auth.uid() = student_id);

-- Only service role (edge functions) can insert claims - no direct client access
CREATE POLICY "Service role can insert reward claims" ON public.reward_claims
  FOR INSERT
  WITH CHECK (false); -- This blocks all client inserts; only service role bypasses RLS

-- Create a secure function to award rewards (called by edge functions with service role)
CREATE OR REPLACE FUNCTION public.award_rewards_secure(
  p_student_id UUID,
  p_claim_type TEXT,
  p_reference_id TEXT,
  p_xp_amount INTEGER,
  p_coin_amount INTEGER,
  p_reason TEXT
) RETURNS JSONB AS $$
DECLARE
  v_claim_key TEXT;
  v_existing_claim UUID;
  v_current_xp INTEGER;
  v_current_coins INTEGER;
BEGIN
  -- Generate unique claim key to prevent double-claiming
  v_claim_key := p_student_id::TEXT || ':' || p_claim_type || ':' || p_reference_id;
  
  -- Check if already claimed
  SELECT id INTO v_existing_claim
  FROM public.reward_claims
  WHERE claim_key = v_claim_key;
  
  IF v_existing_claim IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Rewards already claimed for this activity',
      'already_claimed', true
    );
  END IF;
  
  -- Get current values
  SELECT xp, coins INTO v_current_xp, v_current_coins
  FROM public.student_profiles
  WHERE user_id = p_student_id;
  
  IF v_current_xp IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Student profile not found'
    );
  END IF;
  
  -- Record the claim
  INSERT INTO public.reward_claims (student_id, claim_type, reference_id, claim_key, xp_awarded, coins_awarded)
  VALUES (p_student_id, p_claim_type, p_reference_id, v_claim_key, p_xp_amount, p_coin_amount);
  
  -- Update student profile
  UPDATE public.student_profiles
  SET xp = v_current_xp + p_xp_amount,
      coins = v_current_coins + p_coin_amount,
      updated_at = now()
  WHERE user_id = p_student_id;
  
  -- Add to reward ledger
  INSERT INTO public.reward_ledger (student_id, xp_delta, coin_delta, reason)
  VALUES (p_student_id, p_xp_amount, p_coin_amount, p_reason);
  
  RETURN jsonb_build_object(
    'success', true,
    'xp_awarded', p_xp_amount,
    'coins_awarded', p_coin_amount,
    'new_xp_total', v_current_xp + p_xp_amount,
    'new_coins_total', v_current_coins + p_coin_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke direct execute from public, only service role should call this
REVOKE EXECUTE ON FUNCTION public.award_rewards_secure FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_rewards_secure FROM anon;
REVOKE EXECUTE ON FUNCTION public.award_rewards_secure FROM authenticated;

-- Create index for efficient claim lookups
CREATE INDEX IF NOT EXISTS idx_reward_claims_claim_key ON public.reward_claims(claim_key);
CREATE INDEX IF NOT EXISTS idx_reward_claims_student_id ON public.reward_claims(student_id);