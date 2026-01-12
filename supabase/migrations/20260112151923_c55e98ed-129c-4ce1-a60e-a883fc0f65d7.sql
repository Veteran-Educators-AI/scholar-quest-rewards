-- Update function to include teacher name and class name in welcome notification
CREATE OR REPLACE FUNCTION public.check_pending_enrollments_on_student_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pending RECORD;
  v_user_email TEXT;
  v_class classes%ROWTYPE;
  v_teacher_name TEXT;
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
    -- Get class details
    SELECT * INTO v_class FROM classes WHERE id = v_pending.class_id;
    
    -- Get teacher name
    SELECT full_name INTO v_teacher_name FROM profiles WHERE id = v_class.teacher_id;
    
    -- Create the enrollment
    INSERT INTO enrollments (student_id, class_id)
    VALUES (NEW.user_id, v_pending.class_id)
    ON CONFLICT DO NOTHING;
    
    -- Mark as processed
    UPDATE pending_enrollments
    SET processed = true, processed_at = now()
    WHERE id = v_pending.id;
    
    -- Create welcome notification with teacher name
    INSERT INTO notifications (user_id, type, title, message, icon, data)
    VALUES (
      NEW.user_id,
      'auto_enrolled',
      '🎉 Welcome to ' || COALESCE(v_class.name, 'Class') || '!',
      'You''ve been enrolled in ' || COALESCE(v_teacher_name, 'your teacher') || '''s class. Start completing assignments to earn rewards!',
      '📚',
      jsonb_build_object(
        'class_id', v_pending.class_id,
        'class_name', v_class.name,
        'teacher_name', v_teacher_name,
        'teacher_id', v_class.teacher_id
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Also update the profile-based function
CREATE OR REPLACE FUNCTION public.check_pending_enrollments_on_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pending RECORD;
  v_user_email TEXT;
  v_class classes%ROWTYPE;
  v_teacher_name TEXT;
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
    -- Get class details
    SELECT * INTO v_class FROM classes WHERE id = v_pending.class_id;
    
    -- Get teacher name
    SELECT full_name INTO v_teacher_name FROM profiles WHERE id = v_class.teacher_id;
    
    -- Create the enrollment
    INSERT INTO enrollments (student_id, class_id)
    VALUES (NEW.id, v_pending.class_id)
    ON CONFLICT DO NOTHING;
    
    -- Mark as processed
    UPDATE pending_enrollments
    SET processed = true, processed_at = now()
    WHERE id = v_pending.id;
    
    -- Create welcome notification with teacher name
    INSERT INTO notifications (user_id, type, title, message, icon, data)
    VALUES (
      NEW.id,
      'auto_enrolled',
      '🎉 Welcome to ' || COALESCE(v_class.name, 'Class') || '!',
      'You''ve been enrolled in ' || COALESCE(v_teacher_name, 'your teacher') || '''s class. Start completing assignments to earn rewards!',
      '📚',
      jsonb_build_object(
        'class_id', v_pending.class_id,
        'class_name', v_class.name,
        'teacher_name', v_teacher_name,
        'teacher_id', v_class.teacher_id
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;