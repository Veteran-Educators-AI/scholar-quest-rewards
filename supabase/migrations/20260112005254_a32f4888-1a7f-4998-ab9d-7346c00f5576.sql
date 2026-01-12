-- Create function to notify NYCologic on badge earned
CREATE OR REPLACE FUNCTION public.notify_nycologic_badge_earned()
RETURNS TRIGGER AS $$
DECLARE
  badge_name text;
BEGIN
  -- Get badge name
  SELECT name INTO badge_name FROM public.badges WHERE id = NEW.badge_id;
  
  -- Call the edge function via pg_net (async HTTP call)
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/sync-to-nycologic',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'type', 'badge_earned',
      'data', jsonb_build_object(
        'student_id', NEW.student_id,
        'badge_id', NEW.badge_id,
        'badge_name', badge_name,
        'earned_at', NEW.earned_at
      )
    )
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the insert
  RAISE WARNING 'Failed to notify NYCologic: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for badge earned
DROP TRIGGER IF EXISTS on_badge_earned_notify_nycologic ON public.student_badges;
CREATE TRIGGER on_badge_earned_notify_nycologic
  AFTER INSERT ON public.student_badges
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_nycologic_badge_earned();

-- Create function to notify NYCologic on mastery update
CREATE OR REPLACE FUNCTION public.notify_nycologic_mastery_update()
RETURNS TRIGGER AS $$
DECLARE
  standard_code text;
BEGIN
  -- Only notify if mastery level changed
  IF TG_OP = 'UPDATE' AND OLD.mastery_level = NEW.mastery_level THEN
    RETURN NEW;
  END IF;
  
  -- Get standard code
  SELECT code INTO standard_code FROM public.nys_standards WHERE id = NEW.standard_id;
  
  -- Call the edge function via pg_net (async HTTP call)
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/sync-to-nycologic',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'type', 'mastery_update',
      'data', jsonb_build_object(
        'student_id', NEW.student_id,
        'standard_id', NEW.standard_id,
        'standard_code', standard_code,
        'mastery_level', NEW.mastery_level,
        'attempts_count', NEW.attempts_count,
        'correct_count', NEW.correct_count,
        'mastered_at', NEW.mastered_at
      )
    )
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the update
  RAISE WARNING 'Failed to notify NYCologic: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for mastery updates
DROP TRIGGER IF EXISTS on_mastery_update_notify_nycologic ON public.student_standard_mastery;
CREATE TRIGGER on_mastery_update_notify_nycologic
  AFTER INSERT OR UPDATE ON public.student_standard_mastery
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_nycologic_mastery_update();