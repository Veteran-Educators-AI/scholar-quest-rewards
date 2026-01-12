-- Create function for student_profiles table
CREATE OR REPLACE FUNCTION public.check_pending_enrollments_on_student_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pending RECORD;
  v_user_email TEXT;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO v_user_email FROM auth.users WHERE id = NEW.user_id;
  
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
    VALUES (NEW.user_id, v_pending.class_id)
    ON CONFLICT DO NOTHING;
    
    -- Mark as processed
    UPDATE pending_enrollments
    SET processed = true, processed_at = now()
    WHERE id = v_pending.id;
    
    -- Create welcome notification
    INSERT INTO notifications (user_id, type, title, message, icon, data)
    VALUES (
      NEW.user_id,
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

-- Create trigger on student_profiles table (drop first if exists)
DROP TRIGGER IF EXISTS on_student_profile_created_check_enrollments ON public.student_profiles;

CREATE TRIGGER on_student_profile_created_check_enrollments
  AFTER INSERT ON public.student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_pending_enrollments_on_student_profile();