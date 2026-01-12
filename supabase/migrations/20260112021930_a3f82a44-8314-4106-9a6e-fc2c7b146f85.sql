-- Create lotto_draws table for managing raffle events
CREATE TABLE public.lotto_draws (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  prize_description TEXT NOT NULL,
  prize_image_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  winner_id UUID REFERENCES auth.users(id),
  winner_selected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lotto_entries table for tracking student entries
CREATE TABLE public.lotto_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  draw_id UUID NOT NULL REFERENCES public.lotto_draws(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.assignments(id),
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT NOT NULL DEFAULT 'assignment_completed'
);

-- Add unique constraint to prevent duplicate entries for same assignment
CREATE UNIQUE INDEX idx_unique_entry_per_assignment ON public.lotto_entries(student_id, draw_id, assignment_id) WHERE assignment_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.lotto_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotto_entries ENABLE ROW LEVEL SECURITY;

-- Policies for lotto_draws
CREATE POLICY "Anyone can view active draws" ON public.lotto_draws
  FOR SELECT USING (is_active = true OR winner_id IS NOT NULL);

CREATE POLICY "Teachers and admins can manage draws" ON public.lotto_draws
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- Policies for lotto_entries
CREATE POLICY "Students can view their own entries" ON public.lotto_entries
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own entries" ON public.lotto_entries
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view all entries" ON public.lotto_entries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- Function to award lotto entry on assignment completion
CREATE OR REPLACE FUNCTION public.award_lotto_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_draw lotto_draws%ROWTYPE;
BEGIN
  -- Only process when status changes to 'verified'
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') THEN
    -- Find active draw
    SELECT * INTO v_active_draw
    FROM lotto_draws
    WHERE is_active = true 
      AND now() BETWEEN start_date AND end_date
    ORDER BY end_date ASC
    LIMIT 1;
    
    -- If active draw exists, award entry
    IF v_active_draw.id IS NOT NULL THEN
      INSERT INTO lotto_entries (student_id, draw_id, assignment_id, reason)
      VALUES (NEW.student_id, v_active_draw.id, NEW.assignment_id, 'assignment_completed')
      ON CONFLICT DO NOTHING;
      
      -- Create notification
      INSERT INTO notifications (user_id, type, title, message, icon, data)
      VALUES (
        NEW.student_id,
        'lotto_entry',
        '🎟️ Raffle Entry Earned!',
        'You earned a raffle entry for "' || v_active_draw.title || '"!',
        '🎟️',
        jsonb_build_object('draw_id', v_active_draw.id, 'draw_title', v_active_draw.title)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for lotto entries
CREATE TRIGGER on_attempt_verified_award_lotto
  AFTER UPDATE ON public.attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.award_lotto_entry();

-- Insert a sample active draw
INSERT INTO public.lotto_draws (title, description, prize_description, end_date)
VALUES (
  'January Super Raffle',
  'Complete assignments to earn entries! Every verified assignment = 1 raffle ticket.',
  '🎮 $50 Gaming Gift Card',
  now() + interval '30 days'
);