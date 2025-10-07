-- Add missing is_published column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Set all existing events to published by default for development
UPDATE public.events SET is_published = true WHERE is_published IS NULL;

-- Add is_featured column if it doesn't exist
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
