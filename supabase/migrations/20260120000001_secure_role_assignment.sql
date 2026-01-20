-- Migration: Secure Role Assignment
-- Prevents admin role self-assignment via signup
-- Admin roles can only be granted via allowlist trigger or direct DB update

-- Replace handle_new_user to sanitize role from client metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role;
BEGIN
  -- SECURITY: Never trust client-provided admin role
  -- Only allow student, parent, or teacher from client metadata
  v_role := CASE
    WHEN NEW.raw_user_meta_data->>'role' IN ('student', 'parent', 'teacher')
    THEN (NEW.raw_user_meta_data->>'role')::user_role
    ELSE 'student'::user_role
  END;

  -- Insert profile with sanitized role
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    v_role
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert user role with sanitized role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT DO NOTHING;

  -- Create student profile if role is student
  IF v_role = 'student' THEN
    INSERT INTO public.student_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing permissive policy for user_roles insert
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

-- Create restrictive policy: users can only insert non-admin roles for themselves
CREATE POLICY "Users can insert own non-admin role"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND role != 'admin'::user_role
);

-- Update profiles policy to prevent self-assignment of admin role
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile without admin self-assign"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND (
    role != 'admin'::user_role
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::user_role
  )
);

-- Prevent direct insert of admin role via profiles table
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own non-admin profile"
ON public.profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id
  AND role != 'admin'::user_role
);
