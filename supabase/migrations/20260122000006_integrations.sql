-- Integrations: External Students, API Tokens

CREATE TABLE public.external_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  linked_at TIMESTAMPTZ,
  sync_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(external_id, source)
);

CREATE TABLE public.api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read'],
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- Enable RLS
ALTER TABLE public.external_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;

-- View for students with external data
CREATE VIEW public.students_with_external_data
WITH (security_invoker = true)
AS
SELECT
  p.id as user_id,
  p.full_name,
  sp.xp,
  sp.coins,
  sp.current_streak,
  sp.grade_level,
  sp.skill_tags,
  sp.weaknesses,
  es.external_id,
  es.source,
  es.overall_average,
  es.grades,
  es.weak_topics,
  es.misconceptions,
  es.remediation_recommendations,
  es.class_name as external_class_name,
  es.teacher_name as external_teacher_name,
  es.linked_at
FROM profiles p
LEFT JOIN student_profiles sp ON sp.user_id = p.id
LEFT JOIN external_students es ON es.linked_user_id = p.id
WHERE p.role = 'student';
