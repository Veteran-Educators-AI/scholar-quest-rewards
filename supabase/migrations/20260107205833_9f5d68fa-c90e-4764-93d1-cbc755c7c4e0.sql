-- Add slot column to collectibles for avatar customization
ALTER TABLE public.collectibles 
ADD COLUMN slot text DEFAULT 'accessory';

-- Create equipped_items table for avatar customization
CREATE TABLE public.equipped_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  slot text NOT NULL,
  collectible_id uuid REFERENCES public.collectibles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(student_id, slot)
);

-- Enable RLS
ALTER TABLE public.equipped_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for equipped_items
CREATE POLICY "Students can view own equipped items"
ON public.equipped_items
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can manage own equipped items"
ON public.equipped_items
FOR ALL
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Update existing collectibles with appropriate slots
UPDATE public.collectibles SET slot = 'hat' WHERE name ILIKE '%hat%';
UPDATE public.collectibles SET slot = 'frame' WHERE name ILIKE '%frame%' OR name ILIKE '%border%';
UPDATE public.collectibles SET slot = 'background' WHERE name ILIKE '%background%';
UPDATE public.collectibles SET slot = 'badge' WHERE name ILIKE '%badge%';
UPDATE public.collectibles SET slot = 'pet' WHERE name ILIKE '%pet%' OR name ILIKE '%companion%';

-- Insert sample collectibles for avatar customization with different slots
INSERT INTO public.collectibles (name, description, rarity, slot, image_url) VALUES
-- Frames
('Golden Frame', 'A shimmering golden border for top achievers', 'legendary', 'frame', null),
('Star Frame', 'Surrounded by twinkling stars', 'epic', 'frame', null),
('Rainbow Frame', 'A colorful rainbow border', 'rare', 'frame', null),
('Basic Frame', 'A simple decorative frame', 'common', 'frame', null),
-- Backgrounds
('Galaxy Background', 'A cosmic starfield backdrop', 'legendary', 'background', null),
('Forest Background', 'A peaceful forest scene', 'epic', 'background', null),
('Ocean Background', 'Calm ocean waves', 'rare', 'background', null),
('Sky Background', 'Blue sky with clouds', 'common', 'background', null),
-- Hats
('Wizard Hat', 'The hat of a true scholar wizard', 'legendary', 'hat', null),
('Crown', 'A royal crown for quiz champions', 'epic', 'hat', null),
('Graduation Cap', 'Celebrate your learning journey', 'rare', 'hat', null),
('Baseball Cap', 'A cool casual cap', 'common', 'hat', null),
-- Pets
('Phoenix Companion', 'A magical fire bird by your side', 'legendary', 'pet', null),
('Owl Companion', 'A wise owl friend', 'epic', 'pet', null),
('Cat Companion', 'A curious cat buddy', 'rare', 'pet', null),
('Puppy Companion', 'A loyal puppy friend', 'common', 'pet', null);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_equipped_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for timestamp updates
CREATE TRIGGER update_equipped_items_updated_at
BEFORE UPDATE ON public.equipped_items
FOR EACH ROW
EXECUTE FUNCTION public.update_equipped_items_updated_at();