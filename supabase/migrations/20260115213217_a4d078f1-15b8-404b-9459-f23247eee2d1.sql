-- Create a function to generate random class codes
CREATE OR REPLACE FUNCTION public.generate_class_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Insert classes from external_students that don't already exist
-- Generate new UUIDs for the classes and create unique class codes
INSERT INTO classes (id, name, class_code, teacher_id, subject)
SELECT DISTINCT ON (es.class_name)
  gen_random_uuid(),
  es.class_name,
  public.generate_class_code(),
  COALESCE(
    (SELECT user_id FROM user_roles WHERE role = 'teacher' LIMIT 1),
    (SELECT user_id FROM user_roles WHERE role = 'admin' LIMIT 1)
  ),
  'Math'
FROM external_students es
WHERE es.class_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM classes c 
    WHERE c.name = es.class_name
  );