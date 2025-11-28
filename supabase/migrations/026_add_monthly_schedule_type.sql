-- Migration: Add monthly schedule type
-- Date: 2025-11-27
-- Description: Add 'monthly' to routine_set_type CHECK constraint

-- Update CHECK constraint to include 'monthly'
ALTER TABLE public.routines 
DROP CONSTRAINT IF EXISTS routines_routine_set_type_check;

ALTER TABLE public.routines 
ADD CONSTRAINT routines_routine_set_type_check 
CHECK (routine_set_type IN ('daily', 'weekly', 'monthly', 'custom'));

-- Update comment
COMMENT ON COLUMN public.routines.routine_set_type IS 'Schedule type: daily (every day), weekly (once per week), monthly (once per month), custom (specific days)';

