-- Create function to send parent notification via edge function
CREATE OR REPLACE FUNCTION public.notify_parents_on_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call the edge function to send notification
  PERFORM net.http_post(
    url := 'https://rjlqmfthemfpetpcydog.supabase.co/functions/v1/send-parent-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := jsonb_build_object(
      'type', 'badge_earned',
      'student_id', NEW.student_id,
      'data', jsonb_build_object('badge_name', (SELECT name FROM badges WHERE id = NEW.badge_id))
    )
  );
  RETURN NEW;
END;
$$;

-- Create trigger for badge notifications
DROP TRIGGER IF EXISTS trigger_notify_parents_badge ON student_badges;
CREATE TRIGGER trigger_notify_parents_badge
  AFTER INSERT ON student_badges
  FOR EACH ROW
  EXECUTE FUNCTION notify_parents_on_badge();

-- Create function to notify parents on streak warning
CREATE OR REPLACE FUNCTION public.notify_parents_on_streak_warning()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify for streak_warning type notifications
  IF NEW.type = 'streak_warning' THEN
    PERFORM net.http_post(
      url := 'https://rjlqmfthemfpetpcydog.supabase.co/functions/v1/send-parent-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'streak_warning',
        'student_id', NEW.user_id,
        'data', jsonb_build_object('current_streak', (SELECT current_streak FROM student_profiles WHERE user_id = NEW.user_id))
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for streak warning notifications
DROP TRIGGER IF EXISTS trigger_notify_parents_streak ON notifications;
CREATE TRIGGER trigger_notify_parents_streak
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_parents_on_streak_warning();

-- Create function to notify parents on significant reward
CREATE OR REPLACE FUNCTION public.notify_parents_on_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify for significant rewards (more than 50 XP or 20 coins)
  IF NEW.xp_delta >= 50 OR NEW.coin_delta >= 20 THEN
    PERFORM net.http_post(
      url := 'https://rjlqmfthemfpetpcydog.supabase.co/functions/v1/send-parent-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'reward_earned',
        'student_id', NEW.student_id,
        'data', jsonb_build_object('xp_earned', NEW.xp_delta, 'coins_earned', NEW.coin_delta)
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for reward notifications
DROP TRIGGER IF EXISTS trigger_notify_parents_reward ON reward_ledger;
CREATE TRIGGER trigger_notify_parents_reward
  AFTER INSERT ON reward_ledger
  FOR EACH ROW
  EXECUTE FUNCTION notify_parents_on_reward();