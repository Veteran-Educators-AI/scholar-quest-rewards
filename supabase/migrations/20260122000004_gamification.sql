-- Gamification: Badges, Collectibles, Challenges, Lotto, Skill Games, Rewards

CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  criteria JSONB,
  xp_reward INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, badge_id)
);

CREATE TABLE public.collectibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  rarity collectible_rarity NOT NULL DEFAULT 'common',
  slot TEXT DEFAULT 'accessory',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.student_collectibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collectible_id UUID NOT NULL REFERENCES public.collectibles(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, collectible_id)
);

CREATE TABLE public.equipped_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  slot TEXT NOT NULL,
  collectible_id UUID REFERENCES public.collectibles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, slot)
);

CREATE TABLE public.reward_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_delta INTEGER NOT NULL DEFAULT 0,
  coin_delta INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  assignment_id UUID REFERENCES public.assignments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.reward_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  claim_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  claim_key TEXT NOT NULL UNIQUE,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  coins_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  xp_bonus INTEGER NOT NULL DEFAULT 100,
  coin_bonus INTEGER NOT NULL DEFAULT 25,
  badge_id UUID REFERENCES public.badges(id),
  min_assignments INTEGER NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  assignments_completed INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  rewards_claimed BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, student_id)
);

CREATE TABLE public.lotto_draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  prize_description TEXT NOT NULL,
  prize_image_url TEXT,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  winner_id UUID REFERENCES auth.users(id),
  winner_selected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lotto_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  draw_id UUID NOT NULL REFERENCES public.lotto_draws(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.assignments(id),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT NOT NULL DEFAULT 'assignment_completed'
);

CREATE TABLE public.skill_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  last_played_at TIMESTAMPTZ,
  xp_reward INTEGER NOT NULL DEFAULT 15,
  coin_reward INTEGER NOT NULL DEFAULT 5,
  source TEXT NOT NULL DEFAULT 'nycologic',
  external_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.skill_games(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  streak_max INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  xp_earned INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collectibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_collectibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipped_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotto_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotto_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Unique index for lotto entries per assignment
CREATE UNIQUE INDEX idx_unique_entry_per_assignment ON public.lotto_entries(student_id, draw_id, assignment_id) WHERE assignment_id IS NOT NULL;
