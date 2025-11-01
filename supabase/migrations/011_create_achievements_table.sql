-- Migration: Create achievements table
-- Date: 2025-10-30
-- Description: F10 - Achievement Badges System

CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  reward_claimed BOOLEAN DEFAULT false,
  UNIQUE(user_id, achievement_key)
);

-- Indexes
CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_key ON public.user_achievements(achievement_key);

-- RLS Policies
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own achievements" ON public.user_achievements 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own achievements" ON public.user_achievements 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own achievements" ON public.user_achievements 
  FOR UPDATE USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.user_achievements IS 'Tracks user achievement badges and unlocks';

