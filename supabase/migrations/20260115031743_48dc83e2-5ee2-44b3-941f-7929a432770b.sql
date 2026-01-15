-- Create function to auto-grant admin role for specific email
CREATE OR REPLACE FUNCTION public.auto_grant_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_email TEXT;
  v_admin_emails TEXT[] := ARRAY['gfrancois2@schools.nyc.gov'];
BEGIN
  -- Get user email from auth.users
  SELECT email INTO v_user_email FROM auth.users WHERE id = NEW.id;
  
  -- Check if this email should be an admin
  IF v_user_email IS NOT NULL AND lower(v_user_email) = ANY(SELECT lower(unnest(v_admin_emails))) THEN
    -- Update profile role to admin
    UPDATE profiles SET role = 'admin' WHERE id = NEW.id;
    
    -- Add admin role to user_roles table
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Create welcome notification
    INSERT INTO notifications (user_id, type, title, message, icon)
    VALUES (
      NEW.id,
      'admin_granted',
      '🔐 Admin Access Granted',
      'Welcome! You have been granted administrator privileges.',
      '👑'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_created_auto_grant_admin ON public.profiles;

CREATE TRIGGER on_profile_created_auto_grant_admin
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_grant_admin_on_signup();