-- Create table to track geometry mastery for GeoBlox unlock
CREATE TABLE public.geometry_mastery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  questions_attempted INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  mastery_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  geoblox_unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_student_geometry UNIQUE (student_id)
);

-- Enable RLS
ALTER TABLE public.geometry_mastery ENABLE ROW LEVEL SECURITY;

-- Students can view their own mastery
CREATE POLICY "Students can view their own geometry mastery"
ON public.geometry_mastery
FOR SELECT
USING (auth.uid() = student_id);

-- Only backend can insert/update (via service role)
CREATE POLICY "Service role can manage geometry mastery"
ON public.geometry_mastery
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create index
CREATE INDEX idx_geometry_mastery_student ON public.geometry_mastery(student_id);

-- Add updated_at trigger
CREATE TRIGGER update_geometry_mastery_updated_at
BEFORE UPDATE ON public.geometry_mastery
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();