-- Add preferred_language column to profiles table
ALTER TABLE public.profiles
ADD COLUMN preferred_language text DEFAULT 'en';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.preferred_language IS 'User preferred language code (e.g., en, es, ar, bn, ht)';