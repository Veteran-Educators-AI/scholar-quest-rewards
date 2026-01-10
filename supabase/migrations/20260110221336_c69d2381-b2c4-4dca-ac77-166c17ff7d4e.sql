-- Create table for teacher point deductions
CREATE TABLE public.point_deductions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  class_id UUID NOT NULL,
  points_deducted INTEGER NOT NULL CHECK (points_deducted > 0),
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.point_deductions ENABLE ROW LEVEL SECURITY;

-- Teachers can insert deductions for students in their classes
CREATE POLICY "Teachers can create deductions for their students"
ON public.point_deductions
FOR INSERT
WITH CHECK (
  auth.uid() = teacher_id AND
  EXISTS (
    SELECT 1 FROM classes c
    JOIN enrollments e ON e.class_id = c.id
    WHERE c.id = point_deductions.class_id
    AND c.teacher_id = auth.uid()
    AND e.student_id = point_deductions.student_id
  )
);

-- Teachers can view deductions they created
CREATE POLICY "Teachers can view deductions they created"
ON public.point_deductions
FOR SELECT
USING (auth.uid() = teacher_id);

-- Students can view their own deductions
CREATE POLICY "Students can view own deductions"
ON public.point_deductions
FOR SELECT
USING (auth.uid() = student_id);

-- Parents can view linked student deductions
CREATE POLICY "Parents can view linked student deductions"
ON public.point_deductions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM parent_students ps
    WHERE ps.student_id = point_deductions.student_id
    AND ps.parent_id = auth.uid()
    AND ps.verified = true
  )
);

-- Create function to deduct points and notify parents
CREATE OR REPLACE FUNCTION public.deduct_student_points(
  p_student_id UUID,
  p_class_id UUID,
  p_points INTEGER,
  p_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deduction_id UUID;
  v_current_coins INTEGER;
BEGIN
  -- Insert the deduction record
  INSERT INTO point_deductions (student_id, teacher_id, class_id, points_deducted, reason)
  VALUES (p_student_id, auth.uid(), p_class_id, p_points, p_reason)
  RETURNING id INTO v_deduction_id;

  -- Get current coins
  SELECT coins INTO v_current_coins
  FROM student_profiles
  WHERE user_id = p_student_id;

  -- Update student coins (don't go below 0)
  UPDATE student_profiles
  SET coins = GREATEST(0, coins - p_points),
      updated_at = now()
  WHERE user_id = p_student_id;

  -- Create notification for student
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    p_student_id,
    'points_deducted',
    'Points Deducted',
    format('%s points deducted: %s', p_points, p_reason),
    jsonb_build_object('points', p_points, 'reason', p_reason, 'class_id', p_class_id)
  );

  RETURN v_deduction_id;
END;
$$;