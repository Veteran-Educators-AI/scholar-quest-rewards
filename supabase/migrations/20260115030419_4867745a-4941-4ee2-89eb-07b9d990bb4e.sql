-- Fix permissive RLS policy - restrict to authenticated teachers only
DROP POLICY IF EXISTS "Service role can manage external students" ON public.external_students;

-- Edge functions use service role which bypasses RLS, so we don't need a separate policy for them
-- Teachers can only view students in their classes (will be enforced in code for now since teacher_id is external)