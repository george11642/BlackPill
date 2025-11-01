-- Migration: Create scoring preferences table
-- Date: 2025-10-30
-- Description: F17 - Transparent Scoring Methodology

-- User scoring preferences
CREATE TABLE public.user_scoring_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  symmetry_weight INT DEFAULT 20 CHECK (symmetry_weight BETWEEN 15 AND 25),
  skin_weight INT DEFAULT 20 CHECK (skin_weight BETWEEN 15 AND 25),
  jawline_weight INT DEFAULT 15 CHECK (jawline_weight BETWEEN 10 AND 20),
  eyes_weight INT DEFAULT 15 CHECK (eyes_weight BETWEEN 10 AND 20),
  lips_weight INT DEFAULT 15 CHECK (lips_weight BETWEEN 10 AND 20),
  bone_structure_weight INT DEFAULT 15 CHECK (bone_structure_weight BETWEEN 10 AND 20),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT total_weight_100 CHECK (
    symmetry_weight + skin_weight + jawline_weight + 
    eyes_weight + lips_weight + bone_structure_weight = 100
  )
);

-- Indexes
CREATE INDEX idx_scoring_preferences_user ON public.user_scoring_preferences(user_id);

-- RLS Policies
ALTER TABLE public.user_scoring_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own preferences" ON public.user_scoring_preferences 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own preferences" ON public.user_scoring_preferences 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own preferences" ON public.user_scoring_preferences 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE public.user_scoring_preferences IS 'User-adjustable scoring weights for transparency and customization';

