-- Add INSERT policy for student_profiles so the trigger can create records
CREATE POLICY "Students can insert own student profile"
ON public.student_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to auto-create student profile
CREATE OR REPLACE FUNCTION public.create_student_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create student profile if the user role is 'student'
  IF NEW.role = 'student' THEN
    INSERT INTO public.student_profiles (user_id, xp, coins, current_streak, longest_streak, streak_shield_available)
    VALUES (NEW.id, 0, 0, 0, 0, true)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on profiles table
CREATE TRIGGER on_profile_created_create_student_profile
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_student_profile_on_signup();

-- Add unique constraint on user_id if not exists (for ON CONFLICT to work)
ALTER TABLE public.student_profiles 
ADD CONSTRAINT student_profiles_user_id_unique UNIQUE (user_id);