-- Migration: Server-side Teacher Blocking
-- Blocks teachers from accessing student-specific resources via RLS
-- Teachers are meant to use NYCologic AI, not Scholar Quest

-- RESTRICTIVE policies deny access even if other policies allow it
-- This ensures teachers cannot bypass client-side blocking

-- Block teachers from viewing/modifying student_profiles
CREATE POLICY "Teachers cannot access student profiles"
ON public.student_profiles
AS RESTRICTIVE
FOR ALL
USING (
  NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

-- Block teachers from earning/viewing rewards
CREATE POLICY "Teachers cannot access reward ledger"
ON public.reward_ledger
AS RESTRICTIVE
FOR ALL
USING (
  NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

-- Block teachers from earning badges
CREATE POLICY "Teachers cannot access student badges"
ON public.student_badges
AS RESTRICTIVE
FOR ALL
USING (
  NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

-- Block teachers from earning collectibles
CREATE POLICY "Teachers cannot access student collectibles"
ON public.student_collectibles
AS RESTRICTIVE
FOR ALL
USING (
  NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

-- Block teachers from making attempts on assignments as students
CREATE POLICY "Teachers cannot make student attempts"
ON public.attempts
AS RESTRICTIVE
FOR INSERT
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

-- Block teachers from reward claims
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reward_claims' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Teachers cannot access reward claims"
    ON public.reward_claims
    AS RESTRICTIVE
    FOR ALL
    USING (
      NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = ''teacher''
      )
    )';
  END IF;
END $$;
