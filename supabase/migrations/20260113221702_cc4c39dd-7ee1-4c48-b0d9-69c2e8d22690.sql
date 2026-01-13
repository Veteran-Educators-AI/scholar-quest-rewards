-- Create skill_games table to store generated mini-games
CREATE TABLE public.skill_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('flashcard_battle', 'timed_challenge', 'matching_puzzle')),
  skill_tag TEXT NOT NULL,
  title TEXT NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  game_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_progress', 'completed')),
  high_score INTEGER DEFAULT 0,
  best_time_seconds INTEGER,
  attempts_count INTEGER NOT NULL DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE,
  xp_reward INTEGER NOT NULL DEFAULT 15,
  coin_reward INTEGER NOT NULL DEFAULT 5,
  source TEXT NOT NULL DEFAULT 'nycologic',
  external_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game_sessions table to track individual play sessions
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.skill_games(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  streak_max INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  xp_earned INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.skill_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for skill_games
CREATE POLICY "Students can view own games"
ON public.skill_games FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can update own games"
ON public.skill_games FOR UPDATE
USING (auth.uid() = student_id);

-- RLS policies for game_sessions
CREATE POLICY "Students can view own sessions"
ON public.game_sessions FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own sessions"
ON public.game_sessions FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own sessions"
ON public.game_sessions FOR UPDATE
USING (auth.uid() = student_id);

-- Teachers can view student games
CREATE POLICY "Teachers can view student games"
ON public.skill_games FOR SELECT
USING (EXISTS (
  SELECT 1 FROM enrollments e
  JOIN classes c ON c.id = e.class_id
  WHERE e.student_id = skill_games.student_id
  AND c.teacher_id = auth.uid()
));

CREATE POLICY "Teachers can view student game sessions"
ON public.game_sessions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM skill_games sg
  JOIN enrollments e ON e.student_id = sg.student_id
  JOIN classes c ON c.id = e.class_id
  WHERE sg.id = game_sessions.game_id
  AND c.teacher_id = auth.uid()
));

-- Parents can view linked student games
CREATE POLICY "Parents can view linked student games"
ON public.skill_games FOR SELECT
USING (EXISTS (
  SELECT 1 FROM parent_students ps
  WHERE ps.student_id = skill_games.student_id
  AND ps.parent_id = auth.uid()
  AND ps.verified = true
));

-- Create indexes for performance
CREATE INDEX idx_skill_games_student_id ON public.skill_games(student_id);
CREATE INDEX idx_skill_games_skill_tag ON public.skill_games(skill_tag);
CREATE INDEX idx_skill_games_status ON public.skill_games(status);
CREATE INDEX idx_game_sessions_game_id ON public.game_sessions(game_id);
CREATE INDEX idx_game_sessions_student_id ON public.game_sessions(student_id);

-- Trigger to update updated_at
CREATE TRIGGER update_skill_games_updated_at
BEFORE UPDATE ON public.skill_games
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();