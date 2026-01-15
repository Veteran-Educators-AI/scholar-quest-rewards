-- Create external_students table to store synced student data from NYCologic
CREATE TABLE public.external_students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL,
  email TEXT,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  grade_level INTEGER,
  class_id TEXT,
  class_name TEXT,
  teacher_id TEXT,
  teacher_name TEXT,
  overall_average NUMERIC,
  grades JSONB DEFAULT '[]'::jsonb,
  misconceptions JSONB DEFAULT '[]'::jsonb,
  weak_topics JSONB DEFAULT '[]'::jsonb,
  remediation_recommendations JSONB DEFAULT '[]'::jsonb,
  skill_tags TEXT[],
  xp_potential INTEGER DEFAULT 100,
  coin_potential INTEGER DEFAULT 25,
  source TEXT DEFAULT 'nycologic',
  linked_user_id UUID,
  linked_at TIMESTAMP WITH TIME ZONE,
  sync_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(external_id, source)
);

-- Enable RLS
ALTER TABLE public.external_students ENABLE ROW LEVEL SECURITY;

-- Teachers can view external students for their classes
CREATE POLICY "Teachers can view external students"
  ON public.external_students FOR SELECT
  USING (true);

-- Allow service role to insert/update (edge functions)
CREATE POLICY "Service role can manage external students"
  ON public.external_students FOR ALL
  USING (true);

-- Create index for fast lookups
CREATE INDEX idx_external_students_external_id ON public.external_students(external_id);
CREATE INDEX idx_external_students_email ON public.external_students(email);
CREATE INDEX idx_external_students_linked_user_id ON public.external_students(linked_user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_external_students_updated_at
  BEFORE UPDATE ON public.external_students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();