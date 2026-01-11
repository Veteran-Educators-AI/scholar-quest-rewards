-- Enable realtime for assignments table (notifications already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;

-- Create trigger to notify students when a new assignment is created
CREATE OR REPLACE FUNCTION public.notify_students_on_new_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_enrollment RECORD;
  v_class classes%ROWTYPE;
BEGIN
  -- Get class details
  SELECT * INTO v_class FROM classes WHERE id = NEW.class_id;
  
  -- Notify all students enrolled in the class
  FOR v_enrollment IN 
    SELECT student_id FROM enrollments WHERE class_id = NEW.class_id
  LOOP
    INSERT INTO notifications (user_id, type, title, message, icon, data)
    VALUES (
      v_enrollment.student_id,
      'new_assignment',
      '📚 New Assignment!',
      'Your teacher assigned "' || NEW.title || '" in ' || COALESCE(v_class.name, 'your class') || '. Due: ' || to_char(NEW.due_at, 'Mon DD at HH:MI AM'),
      '📚',
      jsonb_build_object(
        'assignment_id', NEW.id,
        'assignment_title', NEW.title,
        'class_id', NEW.class_id,
        'class_name', v_class.name,
        'due_at', NEW.due_at,
        'xp_reward', NEW.xp_reward,
        'coin_reward', NEW.coin_reward
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_new_assignment_notify_students ON public.assignments;
CREATE TRIGGER on_new_assignment_notify_students
  AFTER INSERT ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_students_on_new_assignment();