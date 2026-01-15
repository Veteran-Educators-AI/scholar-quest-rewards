-- Drop existing policy
DROP POLICY IF EXISTS "Teachers can view external students" ON external_students;

-- Create new policy that allows admins to view all external students
CREATE POLICY "Admins can view all external students"
ON external_students
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'teacher'
  )
);

-- Also ensure admins can manage external students
CREATE POLICY "Admins can insert external students"
ON external_students
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'teacher')
  )
);

CREATE POLICY "Admins can update external students"
ON external_students
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'teacher')
  )
);