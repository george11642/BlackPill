-- Migration: Create daily check-ins table
-- Date: 2025-10-30
-- Description: F9 - Daily Check-In Streaks

CREATE TABLE public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  checkin_time TIMESTAMPTZ DEFAULT NOW(),
  streak_count INT NOT NULL DEFAULT 1,
  activities_completed TEXT[], -- ['scan', 'routine', 'checkin']
  UNIQUE(user_id, checkin_date)
);

-- Indexes
CREATE INDEX idx_daily_checkins_user_date ON public.daily_checkins(user_id, checkin_date DESC);
CREATE INDEX idx_daily_checkins_user_streak ON public.daily_checkins(user_id, streak_count DESC);

-- RLS Policies
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own checkins" ON public.daily_checkins 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own checkins" ON public.daily_checkins 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own checkins" ON public.daily_checkins 
  FOR UPDATE USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.daily_checkins IS 'Tracks daily check-ins and streak counts';

