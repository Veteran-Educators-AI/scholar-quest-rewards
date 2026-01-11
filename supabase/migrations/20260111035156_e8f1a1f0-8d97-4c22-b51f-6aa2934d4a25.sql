-- Create enum for student status types
CREATE TYPE public.student_status_type AS ENUM (
  'on_task',
  'off_task', 
  'needs_support',
  'excellent',
  'absent',
  'late'
);

-- Create table for recording student status
CREATE TABLE public.student_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  status student_status_type NOT NULL,
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_status_logs ENABLE ROW LEVEL SECURITY;

-- Teachers can insert status for students in their classes
CREATE POLICY "Teachers can insert student status"
ON public.student_status_logs
FOR INSERT
TO authenticated
WITH CHECK (
  teacher_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = class_id AND teacher_id = auth.uid()
  )
);

-- Teachers can view status logs for their classes
CREATE POLICY "Teachers can view their class status logs"
ON public.student_status_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classes 
    WHERE id = class_id AND teacher_id = auth.uid()
  )
);

-- Teachers can update status logs they created
CREATE POLICY "Teachers can update their status logs"
ON public.student_status_logs
FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid());

-- Teachers can delete status logs they created
CREATE POLICY "Teachers can delete their status logs"
ON public.student_status_logs
FOR DELETE
TO authenticated
USING (teacher_id = auth.uid());

-- Create index for efficient queries
CREATE INDEX idx_student_status_logs_class ON public.student_status_logs(class_id, recorded_at DESC);
CREATE INDEX idx_student_status_logs_student ON public.student_status_logs(student_id, recorded_at DESC);