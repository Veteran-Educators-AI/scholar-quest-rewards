-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  xp_bonus INTEGER NOT NULL DEFAULT 100,
  coin_bonus INTEGER NOT NULL DEFAULT 25,
  badge_id UUID REFERENCES public.badges(id),
  min_assignments INTEGER NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge participation table
CREATE TABLE public.challenge_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  assignments_completed INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  rewards_claimed BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, student_id)
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- Challenges are viewable by everyone
CREATE POLICY "Anyone can view active challenges"
  ON public.challenges FOR SELECT
  USING (is_active = true);

-- Teachers can manage challenges
CREATE POLICY "Teachers can manage challenges"
  ON public.challenges FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  ));

-- Students can join challenges
CREATE POLICY "Students can join challenges"
  ON public.challenge_participants FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can view own participation
CREATE POLICY "Students can view own participation"
  ON public.challenge_participants FOR SELECT
  USING (auth.uid() = student_id);

-- Students can update own participation
CREATE POLICY "Students can update own participation"
  ON public.challenge_participants FOR UPDATE
  USING (auth.uid() = student_id);

-- Teachers can view all participation
CREATE POLICY "Teachers can view all participation"
  ON public.challenge_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  ));

-- Insert some sample challenges with themed badges
INSERT INTO public.badges (name, description, icon_url, xp_reward, criteria)
VALUES 
  ('Math Master', 'Complete the Math Week challenge', '🧮', 50, '{"type": "challenge", "theme": "math"}'),
  ('Reading Champion', 'Complete the Reading Week challenge', '📚', 50, '{"type": "challenge", "theme": "reading"}'),
  ('Science Explorer', 'Complete the Science Week challenge', '🔬', 50, '{"type": "challenge", "theme": "science"}');

INSERT INTO public.challenges (title, description, theme, start_date, end_date, xp_bonus, coin_bonus, min_assignments, badge_id)
SELECT 
  'MathMania Week',
  'Complete 3 math assignments this week to earn bonus XP and the Math Master badge!',
  'math',
  date_trunc('week', now()),
  date_trunc('week', now()) + interval '7 days',
  150,
  50,
  3,
  id
FROM public.badges WHERE name = 'Math Master';

INSERT INTO public.challenges (title, description, theme, start_date, end_date, xp_bonus, coin_bonus, min_assignments, badge_id)
SELECT 
  'Reading Rally',
  'Complete 3 reading assignments this week for bonus rewards and the Reading Champion badge!',
  'reading',
  date_trunc('week', now()) + interval '7 days',
  date_trunc('week', now()) + interval '14 days',
  150,
  50,
  3,
  id
FROM public.badges WHERE name = 'Reading Champion';