
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Students can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Function to create notification when badge is earned
CREATE OR REPLACE FUNCTION public.notify_badge_earned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge badges%ROWTYPE;
BEGIN
  -- Get badge details
  SELECT * INTO v_badge FROM badges WHERE id = NEW.badge_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, icon, data)
  VALUES (
    NEW.student_id,
    'badge_earned',
    'New Badge Earned! 🏆',
    'You earned the "' || v_badge.name || '" badge!',
    v_badge.icon_url,
    jsonb_build_object('badge_id', NEW.badge_id, 'badge_name', v_badge.name, 'xp_reward', v_badge.xp_reward)
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for badge notifications
CREATE TRIGGER on_badge_earned_notify
  AFTER INSERT ON student_badges
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_badge_earned();

-- Function to create notification for rewards
CREATE OR REPLACE FUNCTION public.notify_reward_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify for significant rewards (assignment completions, not badge XP)
  IF NEW.reason LIKE 'Assignment completed%' THEN
    INSERT INTO notifications (user_id, type, title, message, icon, data)
    VALUES (
      NEW.student_id,
      'reward_received',
      'Rewards Earned! ⭐',
      'You earned ' || NEW.xp_delta || ' XP and ' || NEW.coin_delta || ' coins!',
      NULL,
      jsonb_build_object('xp', NEW.xp_delta, 'coins', NEW.coin_delta, 'reason', NEW.reason)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for reward notifications
CREATE TRIGGER on_reward_notify
  AFTER INSERT ON reward_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_reward_received();

-- Function to check and notify streak warnings (called periodically or on login)
CREATE OR REPLACE FUNCTION public.check_streak_warnings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_last_activity DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Find students with active streaks who haven't completed anything today
  FOR v_profile IN 
    SELECT sp.user_id, sp.current_streak, sp.streak_shield_available
    FROM student_profiles sp
    WHERE sp.current_streak >= 3
  LOOP
    -- Check last activity
    SELECT DATE(MAX(created_at)) INTO v_last_activity
    FROM reward_ledger
    WHERE student_id = v_profile.user_id
      AND reason LIKE 'Assignment completed%';
    
    -- If last activity was yesterday and no notification sent today
    IF v_last_activity = v_today - INTERVAL '1 day' THEN
      -- Check if we already sent a warning today
      IF NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE user_id = v_profile.user_id 
          AND type = 'streak_warning'
          AND DATE(created_at) = v_today
      ) THEN
        INSERT INTO notifications (user_id, type, title, message, icon, data)
        VALUES (
          v_profile.user_id,
          'streak_warning',
          'Streak at Risk! 🔥',
          'Complete an assignment today to keep your ' || v_profile.current_streak || '-day streak alive!',
          NULL,
          jsonb_build_object('current_streak', v_profile.current_streak, 'has_shield', v_profile.streak_shield_available)
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create index for faster queries
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
