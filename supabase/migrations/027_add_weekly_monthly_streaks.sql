-- Migration: Add weekly and monthly streaks to routine_streaks table
-- Date: 2025-01-27
-- Description: Add weekly_streak and monthly_streak tracking to routine_streaks

-- Add weekly and monthly streak columns
ALTER TABLE public.routine_streaks
  ADD COLUMN IF NOT EXISTS weekly_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_weekly_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_monthly_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_weekly_completion DATE,
  ADD COLUMN IF NOT EXISTS last_monthly_completion DATE;

-- Update comment to reflect new streak types
COMMENT ON TABLE public.routine_streaks IS 'Tracks daily, weekly, and monthly completion streaks per routine';
COMMENT ON COLUMN public.routine_streaks.weekly_streak IS 'Current consecutive weeks with at least one completion';
COMMENT ON COLUMN public.routine_streaks.monthly_streak IS 'Current consecutive months with at least one completion';
COMMENT ON COLUMN public.routine_streaks.longest_weekly_streak IS 'Longest weekly streak achieved';
COMMENT ON COLUMN public.routine_streaks.longest_monthly_streak IS 'Longest monthly streak achieved';

