-- Create practice_sets table for remediation exercises
CREATE TABLE public.practice_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  skill_tags TEXT[] DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'nycologic', -- 'nycologic', 'teacher', 'self'
  external_ref TEXT, -- Reference ID from NYCLogic AI
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  printable_url TEXT, -- URL for downloadable PDF worksheet
  xp_reward INTEGER NOT NULL DEFAULT 25,
  coin_reward INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  total_questions INTEGER DEFAULT 0
);

-- Create practice_questions table
CREATE TABLE public.practice_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_set_id UUID NOT NULL REFERENCES public.practice_sets(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice', -- matches question_type enum
  options JSONB,
  answer_key JSONB NOT NULL,
  hint TEXT,
  difficulty INTEGER NOT NULL DEFAULT 1,
  skill_tag TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.practice_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_questions ENABLE ROW LEVEL SECURITY;

-- RLS policies for practice_sets
CREATE POLICY "Students can view own practice sets"
  ON public.practice_sets FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can update own practice sets"
  ON public.practice_sets FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view student practice sets"
  ON public.practice_sets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM enrollments e
    JOIN classes c ON c.id = e.class_id
    WHERE e.student_id = practice_sets.student_id
    AND c.teacher_id = auth.uid()
  ));

CREATE POLICY "Parents can view linked student practice sets"
  ON public.practice_sets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM parent_students ps
    WHERE ps.student_id = practice_sets.student_id
    AND ps.parent_id = auth.uid()
    AND ps.verified = true
  ));

-- RLS policies for practice_questions
CREATE POLICY "Students can view questions for their practice sets"
  ON public.practice_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM practice_sets ps
    WHERE ps.id = practice_questions.practice_set_id
    AND ps.student_id = auth.uid()
  ));

CREATE POLICY "Teachers can view practice questions"
  ON public.practice_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM practice_sets ps
    JOIN enrollments e ON e.student_id = ps.student_id
    JOIN classes c ON c.id = e.class_id
    WHERE ps.id = practice_questions.practice_set_id
    AND c.teacher_id = auth.uid()
  ));

-- Create index for faster lookups
CREATE INDEX idx_practice_sets_student_id ON public.practice_sets(student_id);
CREATE INDEX idx_practice_sets_status ON public.practice_sets(status);
CREATE INDEX idx_practice_questions_set_id ON public.practice_questions(practice_set_id);