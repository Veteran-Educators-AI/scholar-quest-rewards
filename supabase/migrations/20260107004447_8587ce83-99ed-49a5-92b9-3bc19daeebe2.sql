-- Enums for the app
CREATE TYPE public.user_role AS ENUM ('student', 'teacher', 'parent', 'admin');
CREATE TYPE public.assignment_status AS ENUM ('pending', 'active', 'completed', 'archived');
CREATE TYPE public.attempt_mode AS ENUM ('paper', 'in_app');
CREATE TYPE public.attempt_status AS ENUM ('not_started', 'in_progress', 'submitted', 'verified', 'rejected');
CREATE TYPE public.collectible_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');
CREATE TYPE public.question_type AS ENUM ('multiple_choice', 'short_answer', 'numeric', 'drag_order', 'matching');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'student',
  school_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table for RBAC (security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Student profiles with learning info
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  grade_level INTEGER,
  reading_level TEXT,
  math_level TEXT,
  skill_tags TEXT[],
  strengths TEXT[],
  weaknesses TEXT[],
  accommodations TEXT[],
  xp INTEGER NOT NULL DEFAULT 0,
  coins INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  streak_shield_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Classes
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  class_code TEXT NOT NULL UNIQUE,
  grade_level INTEGER,
  subject TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enrollments
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);

-- Assignments
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
  xp_reward INTEGER NOT NULL DEFAULT 50,
  coin_reward INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Questions for in-app assignments
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

-- Student attempts
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

-- Submission assets for paper mode
CREATE TABLE public.submission_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Badges
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  criteria JSONB,
  xp_reward INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student badges
CREATE TABLE public.student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, badge_id)
);

-- Collectibles (Scholar Cards)
CREATE TABLE public.collectibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  rarity collectible_rarity NOT NULL DEFAULT 'common',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student collectibles
CREATE TABLE public.student_collectibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collectible_id UUID NOT NULL REFERENCES public.collectibles(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, collectible_id)
);

-- Reward ledger for tracking XP/coin changes
CREATE TABLE public.reward_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_delta INTEGER NOT NULL DEFAULT 0,
  coin_delta INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  assignment_id UUID REFERENCES public.assignments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Integration tokens for Scan Genius
CREATE TABLE public.integration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  webhook_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collectibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_collectibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;

-- Helper function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper function to get user role from profile
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- RLS Policies

-- Profiles: users can read their own, teachers can read students in their classes
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Teachers can view student profiles" ON public.profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.classes c ON c.id = e.class_id
      WHERE e.student_id = profiles.id AND c.teacher_id = auth.uid()
    )
  );

-- User roles: users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Student profiles: students can view/update their own
CREATE POLICY "Students can view own student profile" ON public.student_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students can update own student profile" ON public.student_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view student profiles in their classes" ON public.student_profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.classes c ON c.id = e.class_id
      WHERE e.student_id = student_profiles.user_id AND c.teacher_id = auth.uid()
    )
  );

-- Classes: teachers can CRUD their own, students can view enrolled
CREATE POLICY "Teachers can manage their classes" ON public.classes FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Students can view enrolled classes" ON public.classes FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM public.enrollments WHERE class_id = classes.id AND student_id = auth.uid())
  );

-- Enrollments: teachers can manage for their classes, students can view their own
CREATE POLICY "Teachers can manage enrollments" ON public.enrollments FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.classes WHERE id = enrollments.class_id AND teacher_id = auth.uid())
  );
CREATE POLICY "Students can view own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = student_id);

-- Assignments: teachers can CRUD for their classes, students can view for enrolled classes
CREATE POLICY "Teachers can manage assignments" ON public.assignments FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.classes WHERE id = assignments.class_id AND teacher_id = auth.uid())
  );
CREATE POLICY "Students can view assignments for enrolled classes" ON public.assignments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.class_id = assignments.class_id AND e.student_id = auth.uid()
    )
  );

-- Questions: same as assignments
CREATE POLICY "Teachers can manage questions" ON public.questions FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.classes c ON c.id = a.class_id
      WHERE a.id = questions.assignment_id AND c.teacher_id = auth.uid()
    )
  );
CREATE POLICY "Students can view questions for their assignments" ON public.questions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.enrollments e ON e.class_id = a.class_id
      WHERE a.id = questions.assignment_id AND e.student_id = auth.uid()
    )
  );

-- Attempts: students can manage their own, teachers can view for their classes
CREATE POLICY "Students can manage own attempts" ON public.attempts FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view and update attempts" ON public.attempts FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.classes c ON c.id = a.class_id
      WHERE a.id = attempts.assignment_id AND c.teacher_id = auth.uid()
    )
  );

-- Submission assets: same as attempts
CREATE POLICY "Students can manage own submission assets" ON public.submission_assets FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.attempts WHERE id = submission_assets.attempt_id AND student_id = auth.uid())
  );
CREATE POLICY "Teachers can view submission assets" ON public.submission_assets FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.attempts att
      JOIN public.assignments a ON a.id = att.assignment_id
      JOIN public.classes c ON c.id = a.class_id
      WHERE att.id = submission_assets.attempt_id AND c.teacher_id = auth.uid()
    )
  );

-- Badges: everyone can view
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (TRUE);

-- Student badges: students can view their own, teachers can view for their students
CREATE POLICY "Students can view own badges" ON public.student_badges FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view student badges" ON public.student_badges FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.classes c ON c.id = e.class_id
      WHERE e.student_id = student_badges.student_id AND c.teacher_id = auth.uid()
    )
  );

-- Collectibles: everyone can view
CREATE POLICY "Anyone can view collectibles" ON public.collectibles FOR SELECT USING (TRUE);

-- Student collectibles: same as student badges
CREATE POLICY "Students can view own collectibles" ON public.student_collectibles FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view student collectibles" ON public.student_collectibles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.classes c ON c.id = e.class_id
      WHERE e.student_id = student_collectibles.student_id AND c.teacher_id = auth.uid()
    )
  );

-- Reward ledger: students can view their own
CREATE POLICY "Students can view own rewards" ON public.reward_ledger FOR SELECT USING (auth.uid() = student_id);

-- Integration tokens: only admins (we'll handle this at app level for now)
CREATE POLICY "Admins can manage integration tokens" ON public.integration_tokens FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student')
  );
  
  -- Create student profile if role is student
  IF COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student') = 'student' THEN
    INSERT INTO public.student_profiles (user_id)
    VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();