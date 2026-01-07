
-- Function to update student streak when assignment is completed on time
CREATE OR REPLACE FUNCTION public.update_student_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment_due_at timestamptz;
  v_student_profile student_profiles%ROWTYPE;
  v_last_completion_date date;
  v_today date := CURRENT_DATE;
BEGIN
  -- Only process when status changes to 'verified'
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') THEN
    -- Get assignment due date
    SELECT due_at INTO v_assignment_due_at
    FROM assignments
    WHERE id = NEW.assignment_id;
    
    -- Check if submitted on time
    IF NEW.submitted_at <= v_assignment_due_at THEN
      -- Get current student profile
      SELECT * INTO v_student_profile
      FROM student_profiles
      WHERE user_id = NEW.student_id;
      
      -- Get last completion date from reward_ledger
      SELECT DATE(created_at) INTO v_last_completion_date
      FROM reward_ledger
      WHERE student_id = NEW.student_id
        AND reason LIKE 'Assignment completed%'
      ORDER BY created_at DESC
      LIMIT 1;
      
      -- Update streak logic
      IF v_last_completion_date = v_today - INTERVAL '1 day' THEN
        -- Consecutive day - increment streak
        UPDATE student_profiles
        SET 
          current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          updated_at = NOW()
        WHERE user_id = NEW.student_id;
      ELSIF v_last_completion_date = v_today THEN
        -- Same day - no change to streak
        NULL;
      ELSE
        -- Streak broken - reset to 1
        UPDATE student_profiles
        SET 
          current_streak = 1,
          longest_streak = GREATEST(longest_streak, 1),
          updated_at = NOW()
        WHERE user_id = NEW.student_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for streak updates
DROP TRIGGER IF EXISTS on_attempt_verified_streak ON attempts;
CREATE TRIGGER on_attempt_verified_streak
  AFTER UPDATE ON attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_student_streak();

-- Function to award badges based on streak milestones
CREATE OR REPLACE FUNCTION public.award_streak_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge_id uuid;
  v_streak_milestones int[] := ARRAY[3, 7, 14, 30, 60, 100];
  v_milestone int;
BEGIN
  -- Check if current_streak was updated and increased
  IF NEW.current_streak > OLD.current_streak THEN
    -- Check each milestone
    FOREACH v_milestone IN ARRAY v_streak_milestones
    LOOP
      IF NEW.current_streak >= v_milestone AND OLD.current_streak < v_milestone THEN
        -- Find the badge for this milestone
        SELECT id INTO v_badge_id
        FROM badges
        WHERE name ILIKE '%' || v_milestone || '%streak%'
           OR name ILIKE '%streak%' || v_milestone || '%'
           OR (criteria->>'streak_days')::int = v_milestone
        LIMIT 1;
        
        -- If badge exists and not already awarded, award it
        IF v_badge_id IS NOT NULL THEN
          INSERT INTO student_badges (student_id, badge_id)
          VALUES (NEW.user_id, v_badge_id)
          ON CONFLICT DO NOTHING;
          
          -- Add XP reward for badge
          INSERT INTO reward_ledger (student_id, xp_delta, coin_delta, reason)
          SELECT NEW.user_id, b.xp_reward, 0, 'Badge earned: ' || b.name
          FROM badges b
          WHERE b.id = v_badge_id;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for badge awarding
DROP TRIGGER IF EXISTS on_streak_updated_badges ON student_profiles;
CREATE TRIGGER on_streak_updated_badges
  AFTER UPDATE ON student_profiles
  FOR EACH ROW
  WHEN (NEW.current_streak IS DISTINCT FROM OLD.current_streak)
  EXECUTE FUNCTION public.award_streak_badges();

-- Insert default streak badges if they don't exist
INSERT INTO badges (name, description, icon_url, xp_reward, criteria)
VALUES 
  ('3-Day Streak', 'Complete assignments on time for 3 days in a row', NULL, 25, '{"streak_days": 3}'),
  ('Week Warrior', 'Complete assignments on time for 7 days in a row', NULL, 50, '{"streak_days": 7}'),
  ('Two-Week Champion', 'Complete assignments on time for 14 days in a row', NULL, 100, '{"streak_days": 14}'),
  ('Monthly Master', 'Complete assignments on time for 30 days in a row', NULL, 200, '{"streak_days": 30}'),
  ('Streak Legend', 'Complete assignments on time for 60 days in a row', NULL, 400, '{"streak_days": 60}'),
  ('Unstoppable', 'Complete assignments on time for 100 days in a row', NULL, 1000, '{"streak_days": 100}')
ON CONFLICT DO NOTHING;

-- Enable realtime for student_profiles to track streak updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_profiles;
