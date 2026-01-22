-- Parent Features: Linking, Pledges, Point Deductions

CREATE TABLE public.parent_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL,
  student_id UUID NOT NULL,
  relationship TEXT NOT NULL DEFAULT 'parent',
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

CREATE TABLE public.parent_reward_pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL,
  student_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  reward_description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_parent_student FOREIGN KEY (parent_id, student_id)
    REFERENCES public.parent_students(parent_id, student_id) ON DELETE CASCADE
);

CREATE TABLE public.parent_point_pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL,
  student_id UUID NOT NULL,
  coin_threshold INTEGER NOT NULL CHECK (coin_threshold > 0),
  reward_description TEXT NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'custom',
  bonus_coins INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.point_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  class_id UUID NOT NULL,
  points_deducted INTEGER NOT NULL CHECK (points_deducted > 0),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_reward_pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_point_pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_deductions ENABLE ROW LEVEL SECURITY;

-- Unique constraint for badge pledges
CREATE UNIQUE INDEX unique_pledge_per_badge ON public.parent_reward_pledges(parent_id, student_id, badge_id) WHERE is_active = true;
