-- Create a security definer function to check if a user is a teacher who owns a class
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(p_teacher_id uuid, p_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classes
    WHERE id = p_class_id
      AND teacher_id = p_teacher_id
  )
$$;

-- Create a security definer function to check if a teacher can view a student profile
CREATE OR REPLACE FUNCTION public.teacher_can_view_student(p_teacher_id uuid, p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.enrollments e
    JOIN public.classes c ON c.id = e.class_id
    WHERE e.student_id = p_student_id
      AND c.teacher_id = p_teacher_id
  )
$$;

-- Drop the old problematic policy
DROP POLICY IF EXISTS "Teachers can view student profiles" ON public.profiles;

-- Create new policy using the security definer function
CREATE POLICY "Teachers can view student profiles"
ON public.profiles
FOR SELECT
USING (public.teacher_can_view_student(auth.uid(), id));

-- Also update enrollments policy to use security definer function
DROP POLICY IF EXISTS "Teachers can manage enrollments" ON public.enrollments;

CREATE POLICY "Teachers can manage enrollments"
ON public.enrollments
FOR ALL
USING (public.is_teacher_of_class(auth.uid(), class_id))
WITH CHECK (public.is_teacher_of_class(auth.uid(), class_id));