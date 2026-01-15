-- Create function to send welcome email on new student signup
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_student_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_email TEXT;
  v_class classes%ROWTYPE;
  v_teacher_name TEXT;
  v_enrollment RECORD;
BEGIN
  -- Only trigger for students with grade_level set (completed onboarding)
  IF NEW.grade_level IS NOT NULL AND (OLD.grade_level IS NULL) THEN
    -- Get user email
    SELECT email INTO v_user_email FROM auth.users WHERE id = NEW.user_id;
    
    -- Get user's first enrollment (if any)
    SELECT e.*, c.name as class_name, c.teacher_id 
    INTO v_enrollment
    FROM enrollments e
    JOIN classes c ON c.id = e.class_id
    WHERE e.student_id = NEW.user_id
    ORDER BY e.enrolled_at ASC
    LIMIT 1;
    
    -- Get teacher name if enrolled
    IF v_enrollment.teacher_id IS NOT NULL THEN
      SELECT full_name INTO v_teacher_name FROM profiles WHERE id = v_enrollment.teacher_id;
    END IF;
    
    -- Call edge function to send welcome email
    PERFORM net.http_post(
      url := 'https://rjlqmfthemfpetpcydog.supabase.co/functions/v1/send-welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
      ),
      body := jsonb_build_object(
        'student_id', NEW.user_id,
        'student_name', (SELECT full_name FROM profiles WHERE id = NEW.user_id),
        'student_email', v_user_email,
        'class_name', v_enrollment.class_name,
        'teacher_name', v_teacher_name
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the update
  RAISE WARNING 'Failed to send welcome email: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- Create trigger for sending welcome email
DROP TRIGGER IF EXISTS trigger_send_welcome_email ON student_profiles;
CREATE TRIGGER trigger_send_welcome_email
  AFTER UPDATE ON student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_email_on_student_signup();