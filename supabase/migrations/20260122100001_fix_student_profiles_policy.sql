-- Fix infinite recursion in student_profiles UPDATE policy
-- The previous policy tried to prevent XP/coins changes by comparing against the same table,
-- which caused infinite recursion. Instead, use a trigger to protect those fields.

-- Drop the problematic policy
DROP POLICY IF EXISTS "Students can update non-reward profile fields" ON public.student_profiles;

-- Create a simpler UPDATE policy
CREATE POLICY "Students can update own student profile" ON public.student_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create a trigger function to protect reward fields from direct modification
CREATE OR REPLACE FUNCTION public.protect_student_reward_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is not a service role call (i.e., a regular user), protect reward fields
  IF current_setting('role', true) != 'service_role' THEN
    -- Preserve the original values for protected fields
    NEW.xp := OLD.xp;
    NEW.coins := OLD.coins;
    NEW.streak := OLD.streak;
    NEW.level := OLD.level;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger (drop first if exists)
DROP TRIGGER IF EXISTS protect_student_rewards ON public.student_profiles;
CREATE TRIGGER protect_student_rewards
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_student_reward_fields();
