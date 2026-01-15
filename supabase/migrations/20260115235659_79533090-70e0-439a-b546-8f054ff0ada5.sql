-- Create function to auto-link external students by email on signup
CREATE OR REPLACE FUNCTION public.link_external_student_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the email from auth.users for this new profile
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- If we found an email, try to link any matching external students
  IF user_email IS NOT NULL THEN
    UPDATE public.external_students
    SET 
      linked_user_id = NEW.id,
      linked_at = NOW()
    WHERE 
      LOWER(email) = LOWER(user_email)
      AND linked_user_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on profiles table (runs after a new user signs up)
DROP TRIGGER IF EXISTS trigger_link_external_student_on_signup ON public.profiles;
CREATE TRIGGER trigger_link_external_student_on_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_external_student_on_signup();

-- Also create a function to manually trigger linking for existing users
CREATE OR REPLACE FUNCTION public.link_my_external_student()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  linked_count INTEGER;
BEGIN
  -- Get current user's email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();

  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Link any matching external students
  UPDATE public.external_students
  SET 
    linked_user_id = auth.uid(),
    linked_at = NOW()
  WHERE 
    LOWER(email) = LOWER(user_email)
    AND linked_user_id IS NULL;

  GET DIAGNOSTICS linked_count = ROW_COUNT;
  RETURN linked_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;