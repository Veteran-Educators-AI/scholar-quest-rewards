-- Create function to link student to external_students record on signup
CREATE OR REPLACE FUNCTION public.link_student_to_external_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_email TEXT;
  v_user_name TEXT;
  v_external RECORD;
BEGIN
  -- Only process for students
  IF NEW.role != 'student' THEN
    RETURN NEW;
  END IF;

  -- Get user email from auth.users
  SELECT email INTO v_user_email FROM auth.users WHERE id = NEW.id;
  v_user_name := NEW.full_name;
  
  IF v_user_email IS NULL AND v_user_name IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Try to find matching external student by email first, then by name
  SELECT * INTO v_external 
  FROM external_students
  WHERE linked_user_id IS NULL
    AND (
      (email IS NOT NULL AND lower(email) = lower(v_user_email))
      OR (full_name IS NOT NULL AND lower(full_name) = lower(v_user_name))
    )
  ORDER BY 
    CASE WHEN lower(email) = lower(v_user_email) THEN 0 ELSE 1 END,
    updated_at DESC
  LIMIT 1;
  
  IF v_external.id IS NOT NULL THEN
    -- Link the external student record to this user
    UPDATE external_students
    SET 
      linked_user_id = NEW.id,
      linked_at = now()
    WHERE id = v_external.id;
    
    -- Create notification about the link
    INSERT INTO notifications (user_id, type, title, message, icon, data)
    VALUES (
      NEW.id,
      'data_linked',
      '📊 Your Data is Connected!',
      'Your grades and learning data from NYCologic have been linked to your account.',
      '🔗',
      jsonb_build_object(
        'external_id', v_external.external_id,
        'source', v_external.source,
        'overall_average', v_external.overall_average
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table for linking
DROP TRIGGER IF EXISTS on_profile_created_link_external_data ON public.profiles;

CREATE TRIGGER on_profile_created_link_external_data
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.link_student_to_external_data();

-- Create function to copy external data to student_profiles after student_profiles is created
CREATE OR REPLACE FUNCTION public.copy_external_data_to_student_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_external RECORD;
BEGIN
  -- Check if this student has linked external data
  SELECT * INTO v_external 
  FROM external_students
  WHERE linked_user_id = NEW.user_id
  LIMIT 1;
  
  IF v_external.id IS NOT NULL THEN
    -- Update student_profiles with external data
    UPDATE student_profiles
    SET 
      grade_level = COALESCE(v_external.grade_level, grade_level),
      skill_tags = COALESCE(v_external.skill_tags, skill_tags),
      weaknesses = COALESCE(
        CASE 
          WHEN v_external.weak_topics IS NOT NULL THEN
            ARRAY(SELECT jsonb_array_elements_text(v_external.weak_topics))
          ELSE NULL
        END,
        weaknesses
      )
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on student_profiles for copying external data
DROP TRIGGER IF EXISTS on_student_profile_created_copy_external_data ON public.student_profiles;

CREATE TRIGGER on_student_profile_created_copy_external_data
AFTER INSERT ON public.student_profiles
FOR EACH ROW
EXECUTE FUNCTION public.copy_external_data_to_student_profile();

-- Create a view to easily see linked students with their external data
CREATE OR REPLACE VIEW public.students_with_external_data AS
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