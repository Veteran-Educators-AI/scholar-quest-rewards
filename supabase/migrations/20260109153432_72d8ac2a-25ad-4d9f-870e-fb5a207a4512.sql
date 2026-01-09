-- Create standards mastery tracking table
CREATE TABLE public.student_standard_mastery (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid NOT NULL,
    standard_id uuid NOT NULL REFERENCES public.nys_standards(id) ON DELETE CASCADE,
    attempts_count integer NOT NULL DEFAULT 0,
    correct_count integer NOT NULL DEFAULT 0,
    mastery_level text NOT NULL DEFAULT 'not_started', -- 'not_started', 'developing', 'approaching', 'mastered'
    last_attempt_at timestamp with time zone,
    mastered_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (student_id, standard_id)
);

-- Enable RLS
ALTER TABLE public.student_standard_mastery ENABLE ROW LEVEL SECURITY;

-- Students can view their own mastery
CREATE POLICY "Students can view own mastery" 
ON public.student_standard_mastery 
FOR SELECT 
USING (auth.uid() = student_id);

-- Teachers can view student mastery in their classes
CREATE POLICY "Teachers can view student mastery" 
ON public.student_standard_mastery 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM enrollments e
    JOIN classes c ON c.id = e.class_id
    WHERE e.student_id = student_standard_mastery.student_id
    AND c.teacher_id = auth.uid()
));

-- Parents can view linked student mastery
CREATE POLICY "Parents can view linked student mastery" 
ON public.student_standard_mastery 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM parent_students ps
    WHERE ps.student_id = student_standard_mastery.student_id
    AND ps.parent_id = auth.uid()
    AND ps.verified = true
));

-- Create API tokens table for external integrations
CREATE TABLE public.api_tokens (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    token_hash text NOT NULL UNIQUE,
    scopes text[] NOT NULL DEFAULT ARRAY['read'],
    created_by uuid NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    last_used_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own API tokens
CREATE POLICY "Users can manage own API tokens" 
ON public.api_tokens 
FOR ALL 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Create indexes
CREATE INDEX idx_student_standard_mastery_student ON public.student_standard_mastery(student_id);
CREATE INDEX idx_student_standard_mastery_standard ON public.student_standard_mastery(standard_id);
CREATE INDEX idx_api_tokens_hash ON public.api_tokens(token_hash);

-- Function to update mastery when assignments are verified
CREATE OR REPLACE FUNCTION public.update_standard_mastery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_standard_id uuid;
    v_is_correct boolean;
    v_current_mastery student_standard_mastery%ROWTYPE;
    v_new_level text;
    v_accuracy numeric;
BEGIN
    -- Only process when status changes to 'verified'
    IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') THEN
        -- Get the standard_id from the assignment
        SELECT standard_id INTO v_standard_id
        FROM assignments
        WHERE id = NEW.assignment_id;
        
        -- Only proceed if assignment has a standard linked
        IF v_standard_id IS NOT NULL THEN
            -- Consider 70% or above as correct
            v_is_correct := COALESCE(NEW.score, 0) >= 70;
            
            -- Upsert mastery record
            INSERT INTO student_standard_mastery (student_id, standard_id, attempts_count, correct_count, last_attempt_at)
            VALUES (NEW.student_id, v_standard_id, 1, CASE WHEN v_is_correct THEN 1 ELSE 0 END, NOW())
            ON CONFLICT (student_id, standard_id) DO UPDATE SET
                attempts_count = student_standard_mastery.attempts_count + 1,
                correct_count = student_standard_mastery.correct_count + CASE WHEN v_is_correct THEN 1 ELSE 0 END,
                last_attempt_at = NOW(),
                updated_at = NOW()
            RETURNING * INTO v_current_mastery;
            
            -- Calculate accuracy and determine mastery level
            v_accuracy := (v_current_mastery.correct_count::numeric / v_current_mastery.attempts_count::numeric) * 100;
            
            IF v_current_mastery.attempts_count >= 3 AND v_accuracy >= 85 THEN
                v_new_level := 'mastered';
            ELSIF v_current_mastery.attempts_count >= 2 AND v_accuracy >= 70 THEN
                v_new_level := 'approaching';
            ELSIF v_current_mastery.attempts_count >= 1 THEN
                v_new_level := 'developing';
            ELSE
                v_new_level := 'not_started';
            END IF;
            
            -- Update mastery level
            UPDATE student_standard_mastery
            SET 
                mastery_level = v_new_level,
                mastered_at = CASE WHEN v_new_level = 'mastered' AND mastered_at IS NULL THEN NOW() ELSE mastered_at END
            WHERE id = v_current_mastery.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for mastery updates
CREATE TRIGGER trigger_update_standard_mastery
AFTER UPDATE ON public.attempts
FOR EACH ROW
EXECUTE FUNCTION public.update_standard_mastery();