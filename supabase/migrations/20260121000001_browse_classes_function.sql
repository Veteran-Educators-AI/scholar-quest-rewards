-- Migration: Browse Classes Functions
-- Allows students to browse and search available classes for enrollment

-- Function to browse classes with pagination, search, and filters
CREATE OR REPLACE FUNCTION public.browse_classes(
  p_search TEXT DEFAULT '',
  p_subject TEXT DEFAULT NULL,
  p_grade_band TEXT DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 6
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  subject TEXT,
  grade_level INTEGER,
  grade_band TEXT,
  teacher_name TEXT,
  student_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow authenticated users to browse classes
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.subject,
    c.grade_level,
    c.grade_band,
    p.full_name AS teacher_name,
    (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id) AS student_count
  FROM classes c
  JOIN profiles p ON p.id = c.teacher_id
  WHERE
    -- Search filter (case-insensitive on name and subject)
    (p_search = '' OR p_search IS NULL OR
     c.name ILIKE '%' || p_search || '%' OR
     c.subject ILIKE '%' || p_search || '%' OR
     p.full_name ILIKE '%' || p_search || '%')
    -- Subject filter
    AND (p_subject IS NULL OR c.subject = p_subject)
    -- Grade band filter
    AND (p_grade_band IS NULL OR c.grade_band = p_grade_band)
  ORDER BY c.name ASC
  LIMIT p_page_size
  OFFSET (p_page - 1) * p_page_size;
END;
$$;

-- Function to get total count of classes matching filters (for pagination)
CREATE OR REPLACE FUNCTION public.browse_classes_count(
  p_search TEXT DEFAULT '',
  p_subject TEXT DEFAULT NULL,
  p_grade_band TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count BIGINT;
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT COUNT(*)
  INTO total_count
  FROM classes c
  JOIN profiles p ON p.id = c.teacher_id
  WHERE
    (p_search = '' OR p_search IS NULL OR
     c.name ILIKE '%' || p_search || '%' OR
     c.subject ILIKE '%' || p_search || '%' OR
     p.full_name ILIKE '%' || p_search || '%')
    AND (p_subject IS NULL OR c.subject = p_subject)
    AND (p_grade_band IS NULL OR c.grade_band = p_grade_band);

  RETURN total_count;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.browse_classes TO authenticated;
GRANT EXECUTE ON FUNCTION public.browse_classes_count TO authenticated;
