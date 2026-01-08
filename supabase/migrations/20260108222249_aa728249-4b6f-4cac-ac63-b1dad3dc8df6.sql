-- Create function to notify parents on assignment completion
CREATE OR REPLACE FUNCTION public.notify_parents_on_assignment_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_assignment assignments%ROWTYPE;
BEGIN
  -- Only trigger when status changes to 'verified'
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') THEN
    -- Get assignment details
    SELECT * INTO v_assignment FROM assignments WHERE id = NEW.assignment_id;
    
    -- Call the edge function to send notification
    PERFORM net.http_post(
      url := 'https://rjlqmfthemfpetpcydog.supabase.co/functions/v1/send-parent-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'assignment_completed',
        'student_id', NEW.student_id,
        'data', jsonb_build_object(
          'assignment_title', v_assignment.title,
          'score', NEW.score
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger for assignment completion notifications
DROP TRIGGER IF EXISTS trigger_notify_parents_assignment_complete ON public.attempts;
CREATE TRIGGER trigger_notify_parents_assignment_complete
  AFTER UPDATE ON public.attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_parents_on_assignment_complete();