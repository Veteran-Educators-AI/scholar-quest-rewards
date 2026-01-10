-- Create table for point-based reward pledges
CREATE TABLE public.parent_point_pledges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL,
  student_id UUID NOT NULL,
  coin_threshold INTEGER NOT NULL CHECK (coin_threshold > 0),
  reward_description TEXT NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'custom',
  is_active BOOLEAN NOT NULL DEFAULT true,
  claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parent_point_pledges ENABLE ROW LEVEL SECURITY;

-- Parents can create pledges for their verified students
CREATE POLICY "Parents can create point pledges for their students"
ON public.parent_point_pledges
FOR INSERT
WITH CHECK (
  auth.uid() = parent_id AND
  EXISTS (
    SELECT 1 FROM parent_students
    WHERE parent_id = auth.uid()
    AND student_id = parent_point_pledges.student_id
    AND verified = true
  )
);

-- Parents can view their own pledges
CREATE POLICY "Parents can view their own point pledges"
ON public.parent_point_pledges
FOR SELECT
USING (auth.uid() = parent_id);

-- Parents can update their own pledges
CREATE POLICY "Parents can update their own point pledges"
ON public.parent_point_pledges
FOR UPDATE
USING (auth.uid() = parent_id);

-- Parents can delete their own pledges
CREATE POLICY "Parents can delete their own point pledges"
ON public.parent_point_pledges
FOR DELETE
USING (auth.uid() = parent_id);

-- Students can view pledges for them
CREATE POLICY "Students can view point pledges for them"
ON public.parent_point_pledges
FOR SELECT
USING (auth.uid() = student_id);

-- Create trigger for updated_at
CREATE TRIGGER update_parent_point_pledges_updated_at
BEFORE UPDATE ON public.parent_point_pledges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if student reached pledge threshold
CREATE OR REPLACE FUNCTION public.check_point_pledge_thresholds()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pledge RECORD;
  v_student_name TEXT;
BEGIN
  -- Only check when coins increase (from reward_ledger or after deduction recovery)
  IF NEW.coins > OLD.coins THEN
    -- Get student name
    SELECT full_name INTO v_student_name FROM profiles WHERE id = NEW.user_id;
    
    -- Check all active unclaimed pledges for this student
    FOR v_pledge IN 
      SELECT * FROM parent_point_pledges
      WHERE student_id = NEW.user_id
      AND is_active = true
      AND claimed = false
      AND coin_threshold <= NEW.coins
    LOOP
      -- Create notification for parent
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (
        v_pledge.parent_id,
        'point_pledge_reached',
        '🎉 Reward Milestone Reached!',
        v_student_name || ' reached ' || v_pledge.coin_threshold || ' coins! Time to deliver: ' || v_pledge.reward_description,
        jsonb_build_object(
          'pledge_id', v_pledge.id,
          'student_id', NEW.user_id,
          'student_name', v_student_name,
          'threshold', v_pledge.coin_threshold,
          'current_coins', NEW.coins,
          'reward_description', v_pledge.reward_description
        )
      );
      
      -- Create notification for student
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (
        NEW.user_id,
        'reward_unlocked',
        '🎁 Reward Unlocked!',
        'You reached ' || v_pledge.coin_threshold || ' coins! Your parent promised: ' || v_pledge.reward_description,
        jsonb_build_object(
          'pledge_id', v_pledge.id,
          'threshold', v_pledge.coin_threshold,
          'reward_description', v_pledge.reward_description
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to check thresholds when student profile updates
CREATE TRIGGER check_point_pledges_on_coin_change
AFTER UPDATE OF coins ON public.student_profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_point_pledge_thresholds();