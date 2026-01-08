-- Create table for parent reward pledges
CREATE TABLE public.parent_reward_pledges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL,
  student_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  reward_description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_parent_student FOREIGN KEY (parent_id, student_id) 
    REFERENCES public.parent_students(parent_id, student_id) ON DELETE CASCADE
);

-- Create unique constraint to prevent duplicate pledges for same badge
CREATE UNIQUE INDEX unique_pledge_per_badge ON public.parent_reward_pledges(parent_id, student_id, badge_id) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.parent_reward_pledges ENABLE ROW LEVEL SECURITY;

-- Parents can view their own pledges
CREATE POLICY "Parents can view their own pledges"
ON public.parent_reward_pledges
FOR SELECT
USING (auth.uid() = parent_id);

-- Parents can create pledges for their linked students
CREATE POLICY "Parents can create pledges for their students"
ON public.parent_reward_pledges
FOR INSERT
WITH CHECK (
  auth.uid() = parent_id 
  AND EXISTS (
    SELECT 1 FROM public.parent_students 
    WHERE parent_id = auth.uid() 
    AND student_id = parent_reward_pledges.student_id
    AND verified = true
  )
);

-- Parents can update their own pledges
CREATE POLICY "Parents can update their own pledges"
ON public.parent_reward_pledges
FOR UPDATE
USING (auth.uid() = parent_id);

-- Parents can delete their own pledges
CREATE POLICY "Parents can delete their own pledges"
ON public.parent_reward_pledges
FOR DELETE
USING (auth.uid() = parent_id);

-- Students can view pledges made for them
CREATE POLICY "Students can view pledges for them"
ON public.parent_reward_pledges
FOR SELECT
USING (auth.uid() = student_id);

-- Add trigger to update updated_at
CREATE TRIGGER update_parent_reward_pledges_updated_at
BEFORE UPDATE ON public.parent_reward_pledges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to notify parents when their child earns a pledged badge
CREATE OR REPLACE FUNCTION public.notify_parent_badge_pledge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pledge RECORD;
  v_badge badges%ROWTYPE;
  v_student_name TEXT;
BEGIN
  -- Get badge details
  SELECT * INTO v_badge FROM badges WHERE id = NEW.badge_id;
  
  -- Get student name
  SELECT full_name INTO v_student_name FROM profiles WHERE id = NEW.student_id;
  
  -- Find any active pledges for this badge
  FOR v_pledge IN 
    SELECT * FROM parent_reward_pledges 
    WHERE student_id = NEW.student_id 
    AND badge_id = NEW.badge_id 
    AND is_active = true 
    AND claimed = false
  LOOP
    -- Create notification for parent
    INSERT INTO notifications (user_id, type, title, message, icon, data)
    VALUES (
      v_pledge.parent_id,
      'pledge_triggered',
      'Reward Pledge Triggered! 🎁',
      v_student_name || ' earned the "' || v_badge.name || '" badge! Time to deliver: ' || v_pledge.reward_description,
      v_badge.icon_url,
      jsonb_build_object(
        'pledge_id', v_pledge.id,
        'badge_id', NEW.badge_id,
        'badge_name', v_badge.name,
        'student_id', NEW.student_id,
        'student_name', v_student_name,
        'reward_description', v_pledge.reward_description
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for badge earned notifications to parents
CREATE TRIGGER notify_parent_on_badge_pledge
AFTER INSERT ON public.student_badges
FOR EACH ROW
EXECUTE FUNCTION public.notify_parent_badge_pledge();