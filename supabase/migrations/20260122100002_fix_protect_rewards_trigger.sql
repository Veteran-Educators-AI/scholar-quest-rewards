-- Fix the protect_student_reward_fields trigger to use correct column names

CREATE OR REPLACE FUNCTION public.protect_student_reward_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is not a service role call, protect reward fields
  IF current_setting('role', true) != 'service_role' THEN
    NEW.xp := OLD.xp;
    NEW.coins := OLD.coins;
    NEW.current_streak := OLD.current_streak;
    NEW.longest_streak := OLD.longest_streak;
    NEW.streak_shield_available := OLD.streak_shield_available;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
