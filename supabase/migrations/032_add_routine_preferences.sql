-- Migration: Add routine preferences (time commitment and tier preference)
-- Date: 2025-01-27
-- Description: Add time_commitment and tier_preference columns to routines table

-- Add time_commitment column to routines table
ALTER TABLE public.routines 
ADD COLUMN IF NOT EXISTS time_commitment TEXT DEFAULT 'medium';

-- Drop constraint if it exists, then add it
ALTER TABLE public.routines
DROP CONSTRAINT IF EXISTS routines_time_commitment_check;

ALTER TABLE public.routines
ADD CONSTRAINT routines_time_commitment_check 
CHECK (time_commitment IN ('quick', 'medium', 'dedicated'));

-- Add tier_preference column to routines table
ALTER TABLE public.routines 
ADD COLUMN IF NOT EXISTS tier_preference TEXT DEFAULT 'all';

-- Drop constraint if it exists, then add it
ALTER TABLE public.routines
DROP CONSTRAINT IF EXISTS routines_tier_preference_check;

ALTER TABLE public.routines
ADD CONSTRAINT routines_tier_preference_check 
CHECK (tier_preference IN ('all', 'diy-only', 'diy-otc'));

-- Update existing routines to have default values
UPDATE public.routines 
SET time_commitment = 'medium' 
WHERE time_commitment IS NULL;

UPDATE public.routines 
SET tier_preference = 'all' 
WHERE tier_preference IS NULL;

-- Comments for documentation
COMMENT ON COLUMN public.routines.time_commitment IS 'Daily time commitment: quick (10-15 min), medium (20-30 min), dedicated (45+ min)';
COMMENT ON COLUMN public.routines.tier_preference IS 'Routine approach: all (DIY + Products + Professional), diy-only (free habits only), diy-otc (home & over-the-counter)';

