-- Add bonus_coins column to parent_point_pledges
ALTER TABLE public.parent_point_pledges 
ADD COLUMN bonus_coins integer NOT NULL DEFAULT 0;

-- Create function to award bonus coins when pledge is claimed
CREATE OR REPLACE FUNCTION public.award_bonus_coins_on_claim()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when claimed changes from false to true
  IF NEW.claimed = true AND OLD.claimed = false AND NEW.bonus_coins > 0 THEN
    -- Add bonus coins to student's profile
    UPDATE public.student_profiles
    SET coins = coins + NEW.bonus_coins,
        updated_at = now()
    WHERE user_id = NEW.student_id;

    -- Create a reward ledger entry
    INSERT INTO public.reward_ledger (student_id, coin_delta, xp_delta, reason)
    VALUES (
      NEW.student_id,
      NEW.bonus_coins,
      0,
      'Celebration bonus from parent for reaching ' || NEW.coin_threshold || ' coins!'
    );

    -- Create notification for student
    INSERT INTO public.notifications (user_id, type, title, message, icon)
    VALUES (
      NEW.student_id,
      'bonus_coins',
      '🎉 Celebration Bonus!',
      'Your parent awarded you ' || NEW.bonus_coins || ' bonus coins for reaching your goal!',
      '🎁'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for bonus coins
DROP TRIGGER IF EXISTS award_bonus_on_pledge_claim ON public.parent_point_pledges;
CREATE TRIGGER award_bonus_on_pledge_claim
  BEFORE UPDATE ON public.parent_point_pledges
  FOR EACH ROW
  EXECUTE FUNCTION public.award_bonus_coins_on_claim();