-- Create student invite links table
CREATE TABLE public.student_invite_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  teacher_id UUID NOT NULL,
  student_name TEXT,
  student_email TEXT,
  external_ref TEXT,
  class_id UUID REFERENCES public.classes(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID
);

-- Create index for fast token lookup
CREATE INDEX idx_student_invite_links_token ON public.student_invite_links(token);

-- Enable RLS
ALTER TABLE public.student_invite_links ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own invite links
CREATE POLICY "Teachers can view own invite links"
ON public.student_invite_links
FOR SELECT
USING (teacher_id = auth.uid());

-- Teachers can create invite links
CREATE POLICY "Teachers can create invite links"
ON public.student_invite_links
FOR INSERT
WITH CHECK (teacher_id = auth.uid());

-- Teachers can delete their own invite links
CREATE POLICY "Teachers can delete own invite links"
ON public.student_invite_links
FOR DELETE
USING (teacher_id = auth.uid());

-- Allow public read of valid tokens (for invite page)
CREATE POLICY "Anyone can read valid invite tokens"
ON public.student_invite_links
FOR SELECT
USING (used_at IS NULL AND expires_at > now());

-- Function to process invite link after signup
CREATE OR REPLACE FUNCTION public.process_invite_link(p_token TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_invite student_invite_links%ROWTYPE;
  v_class classes%ROWTYPE;
  v_teacher_name TEXT;
BEGIN
  -- Find valid invite
  SELECT * INTO v_invite
  FROM student_invite_links
  WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > now();
  
  IF v_invite.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite link');
  END IF;
  
  -- Mark invite as used
  UPDATE student_invite_links
  SET used_at = now(), used_by = p_user_id
  WHERE id = v_invite.id;
  
  -- If class_id provided, enroll student
  IF v_invite.class_id IS NOT NULL THEN
    INSERT INTO enrollments (student_id, class_id)
    VALUES (p_user_id, v_invite.class_id)
    ON CONFLICT DO NOTHING;
    
    -- Get class and teacher info for notification
    SELECT * INTO v_class FROM classes WHERE id = v_invite.class_id;
    SELECT full_name INTO v_teacher_name FROM profiles WHERE id = v_invite.teacher_id;
    
    -- Create welcome notification
    INSERT INTO notifications (user_id, type, title, message, icon, data)
    VALUES (
      p_user_id,
      'invite_accepted',
      '🎉 Welcome to ' || COALESCE(v_class.name, 'Class') || '!',
      'You''ve joined ' || COALESCE(v_teacher_name, 'your teacher') || '''s class. Start earning rewards!',
      '📚',
      jsonb_build_object(
        'class_id', v_invite.class_id,
        'teacher_id', v_invite.teacher_id,
        'invite_token', p_token
      )
    );
  ELSE
    -- Just create a welcome notification without class enrollment
    SELECT full_name INTO v_teacher_name FROM profiles WHERE id = v_invite.teacher_id;
    
    INSERT INTO notifications (user_id, type, title, message, icon, data)
    VALUES (
      p_user_id,
      'invite_accepted',
      '🎉 Welcome to ScholarQuest!',
      'Your teacher ' || COALESCE(v_teacher_name, '') || ' invited you. Start earning rewards!',
      '🎓',
      jsonb_build_object(
        'teacher_id', v_invite.teacher_id,
        'invite_token', p_token
      )
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'teacher_id', v_invite.teacher_id,
    'class_id', v_invite.class_id,
    'external_ref', v_invite.external_ref
  );
END;
$$;