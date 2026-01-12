-- Create pending_enrollments table for pre-registered students
CREATE TABLE public.pending_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  student_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(email, class_id)
);

-- Enable RLS
ALTER TABLE public.pending_enrollments ENABLE ROW LEVEL SECURITY;

-- Teachers can manage pending enrollments for their classes
CREATE POLICY "Teachers can manage pending enrollments"
ON public.pending_enrollments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = pending_enrollments.class_id
    AND classes.teacher_id = auth.uid()
  )
);

-- Create index for faster email lookups
CREATE INDEX idx_pending_enrollments_email ON public.pending_enrollments(email) WHERE processed = false;

-- Create function to auto-enroll students on signup
CREATE OR REPLACE FUNCTION public.process_pending_enrollments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending RECORD;
  v_user_email TEXT;
BEGIN
  -- Get the user's email
  v_user_email := NEW.email;
  
  -- Find and process any pending enrollments for this email
  FOR v_pending IN
    SELECT * FROM pending_enrollments
    WHERE lower(email) = lower(v_user_email)
    AND processed = false
  LOOP
    -- Create the enrollment
    INSERT INTO enrollments (student_id, class_id)
    VALUES (NEW.id, v_pending.class_id)
    ON CONFLICT DO NOTHING;
    
    -- Mark as processed
    UPDATE pending_enrollments
    SET processed = true, processed_at = now()
    WHERE id = v_pending.id;
    
    -- Create welcome notification
    INSERT INTO notifications (user_id, type, title, message, icon, data)
    VALUES (
      NEW.id,
      'auto_enrolled',
      '🎉 Welcome to Class!',
      'You''ve been automatically enrolled in your teacher''s class. Start completing assignments to earn rewards!',
      '📚',
      jsonb_build_object('class_id', v_pending.class_id)
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to process enrollments when user is created
-- Note: This trigger is on profiles since we can't directly trigger on auth.users
CREATE OR REPLACE FUNCTION public.check_pending_enrollments_on_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending RECORD;
  v_user_email TEXT;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO v_user_email FROM auth.users WHERE id = NEW.id;
  
  IF v_user_email IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Find and process any pending enrollments for this email
  FOR v_pending IN
    SELECT * FROM pending_enrollments
    WHERE lower(email) = lower(v_user_email)
    AND processed = false
  LOOP
    -- Create the enrollment
    INSERT INTO enrollments (student_id, class_id)
    VALUES (NEW.id, v_pending.class_id)
    ON CONFLICT DO NOTHING;
    
    -- Mark as processed
    UPDATE pending_enrollments
    SET processed = true, processed_at = now()
    WHERE id = v_pending.id;
    
    -- Create welcome notification
    INSERT INTO notifications (user_id, type, title, message, icon, data)
    VALUES (
      NEW.id,
      'auto_enrolled',
      '🎉 Welcome to Class!',
      'You''ve been automatically enrolled in your teacher''s class. Start completing assignments to earn rewards!',
      '📚',
      jsonb_build_object('class_id', v_pending.class_id)
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_created_check_enrollments ON public.profiles;
CREATE TRIGGER on_profile_created_check_enrollments
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_pending_enrollments_on_profile();