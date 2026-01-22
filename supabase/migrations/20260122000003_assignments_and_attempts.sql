-- Assignments, Questions, Attempts, Standards

CREATE TABLE public.nys_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  grade_band TEXT NOT NULL,
  domain TEXT NOT NULL,
  cluster TEXT,
  standard_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  printable_url TEXT,
  external_ref TEXT,
  status assignment_status NOT NULL DEFAULT 'active',
  standard_id UUID REFERENCES public.nys_standards(id),
  xp_reward INTEGER NOT NULL DEFAULT 50,
  coin_reward INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  question_type question_type NOT NULL DEFAULT 'multiple_choice',
  skill_tag TEXT,
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
  prompt TEXT NOT NULL,
  options JSONB,
  answer_key JSONB NOT NULL,
  hint TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode attempt_mode NOT NULL,
  status attempt_status NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  score INTEGER,
  time_spent_seconds INTEGER,
  answers JSONB,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

CREATE TABLE public.submission_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.student_standard_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  standard_id UUID NOT NULL REFERENCES public.nys_standards(id) ON DELETE CASCADE,
  attempts_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  mastery_level TEXT NOT NULL DEFAULT 'not_started',
  last_attempt_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, standard_id)
);

CREATE TABLE public.practice_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  skill_tags TEXT[] DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'nycologic',
  external_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  printable_url TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 25,
  coin_reward INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  score INTEGER,
  total_questions INTEGER DEFAULT 0
);

CREATE TABLE public.practice_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_set_id UUID NOT NULL REFERENCES public.practice_sets(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  options JSONB,
  answer_key JSONB NOT NULL,
  hint TEXT,
  difficulty INTEGER NOT NULL DEFAULT 1,
  skill_tag TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.geometry_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE,
  questions_attempted INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  mastery_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  geoblox_unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nys_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_standard_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geometry_mastery ENABLE ROW LEVEL SECURITY;

-- Enable realtime for assignments
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;
