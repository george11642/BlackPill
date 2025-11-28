-- Migration: Add schedule types to routines
-- Date: 2025-11-27
-- Description: Add routine_set_type for daily/weekly/custom scheduling

-- Add routine_set_type column to routines table
ALTER TABLE public.routines 
ADD COLUMN IF NOT EXISTS routine_set_type TEXT DEFAULT 'daily' 
CHECK (routine_set_type IN ('daily', 'weekly', 'custom'));

-- Add days_of_week column for custom schedule routines
ALTER TABLE public.routines 
ADD COLUMN IF NOT EXISTS days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}';

-- Add index for routine_set_type queries
CREATE INDEX IF NOT EXISTS idx_routines_set_type ON public.routines(user_id, routine_set_type);

-- Update existing routines to have daily schedule type
UPDATE public.routines SET routine_set_type = 'daily' WHERE routine_set_type IS NULL;

-- Comments for documentation
COMMENT ON COLUMN public.routines.routine_set_type IS 'Schedule type: daily (every day), weekly (once per week), custom (specific days)';
COMMENT ON COLUMN public.routines.days_of_week IS 'Array of day numbers (0=Sunday, 1=Monday, ..., 6=Saturday) for custom schedules';

