
-- Create parent_students linking table
CREATE TABLE public.parent_students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL,
  student_id UUID NOT NULL,
  relationship TEXT NOT NULL DEFAULT 'parent',
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

-- Enable RLS
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;

-- Parents can view their own links
CREATE POLICY "Parents can view own links"
ON public.parent_students
FOR SELECT
USING (auth.uid() = parent_id);

-- Parents can request to link students (verification needed)
CREATE POLICY "Parents can insert own links"
ON public.parent_students
FOR INSERT
WITH CHECK (auth.uid() = parent_id);

-- Teachers can verify parent-student links for their students
CREATE POLICY "Teachers can verify links"
ON public.parent_students
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM enrollments e
  JOIN classes c ON c.id = e.class_id
  WHERE e.student_id = parent_students.student_id
    AND c.teacher_id = auth.uid()
));

-- Allow parents to read student profiles they're linked to
CREATE POLICY "Parents can view linked student profiles"
ON public.student_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM parent_students ps
    WHERE ps.student_id = student_profiles.user_id
      AND ps.parent_id = auth.uid()
      AND ps.verified = true
  )
);

-- Allow parents to view linked student's badges
CREATE POLICY "Parents can view linked student badges"
ON public.student_badges
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM parent_students ps
    WHERE ps.student_id = student_badges.student_id
      AND ps.parent_id = auth.uid()
      AND ps.verified = true
  )
);

-- Allow parents to view linked student's collectibles
CREATE POLICY "Parents can view linked student collectibles"
ON public.student_collectibles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM parent_students ps
    WHERE ps.student_id = student_collectibles.student_id
      AND ps.parent_id = auth.uid()
      AND ps.verified = true
  )
);

-- Allow parents to view linked student's reward history
CREATE POLICY "Parents can view linked student rewards"
ON public.reward_ledger
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM parent_students ps
    WHERE ps.student_id = reward_ledger.student_id
      AND ps.parent_id = auth.uid()
      AND ps.verified = true
  )
);

-- Allow parents to view linked student's profile info
CREATE POLICY "Parents can view linked profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM parent_students ps
    WHERE ps.student_id = profiles.id
      AND ps.parent_id = auth.uid()
      AND ps.verified = true
  )
);
