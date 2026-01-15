-- Drop the security definer view and recreate with invoker rights
DROP VIEW IF EXISTS public.students_with_external_data;

-- Recreate view without security definer (defaults to SECURITY INVOKER)
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