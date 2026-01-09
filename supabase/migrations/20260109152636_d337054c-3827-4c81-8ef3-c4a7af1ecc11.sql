-- Create NYS Learning Standards table
CREATE TABLE public.nys_standards (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    subject text NOT NULL,
    grade_band text NOT NULL, -- e.g., '9-10', '11-12'
    domain text NOT NULL,
    cluster text,
    standard_text text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nys_standards ENABLE ROW LEVEL SECURITY;

-- Anyone can view standards (public reference data)
CREATE POLICY "Anyone can view standards" 
ON public.nys_standards 
FOR SELECT 
USING (true);

-- Add standards alignment to assignments
ALTER TABLE public.assignments 
ADD COLUMN standard_id uuid REFERENCES public.nys_standards(id);

-- Add grade band to classes for 9-12 support
ALTER TABLE public.classes 
ADD COLUMN grade_band text;

-- Create index for faster lookups
CREATE INDEX idx_nys_standards_subject ON public.nys_standards(subject);
CREATE INDEX idx_nys_standards_grade_band ON public.nys_standards(grade_band);
CREATE INDEX idx_assignments_standard_id ON public.assignments(standard_id);