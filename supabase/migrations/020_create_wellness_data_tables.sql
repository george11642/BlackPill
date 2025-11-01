-- Migration: Create wearable integration and wellness data tables
-- Date: 2025-10-30
-- Description: F21 - Wearable Integration (Wellness-Aesthetic Correlation)

-- User wellness data (from wearables)
CREATE TABLE public.user_wellness_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sleep_hours NUMERIC,
  sleep_quality TEXT CHECK (sleep_quality IN ('poor', 'fair', 'good', 'excellent')),
  sleep_source TEXT, -- 'Apple Watch', 'Fitbit', 'Whoop', 'Manual'
  hydration_ounces NUMERIC,
  hydration_goal NUMERIC,
  hydration_source TEXT, -- 'Apple Health', 'Manual'
  hrv NUMERIC, -- Heart rate variability (ms)
  resting_hr NUMERIC,
  stress_level TEXT CHECK (stress_level IN ('low', 'medium', 'high')),
  stress_source TEXT, -- 'Apple Watch', 'Fitbit', 'Whoop'
  exercise_minutes INT,
  exercise_intensity TEXT CHECK (exercise_intensity IN ('light', 'moderate', 'vigorous')),
  exercise_type TEXT[], -- ['cardio', 'strength', 'yoga']
  exercise_calories INT,
  exercise_source TEXT, -- 'Apple Health', 'Google Fit'
  calories_consumed INT,
  protein_grams NUMERIC,
  water_intake NUMERIC,
  nutrition_source TEXT, -- 'MyFitnessPal', 'Manual'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Wellness correlations (pre-calculated insights)
CREATE TABLE public.wellness_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'sleep', 'hydration', 'exercise', 'stress'
  correlation_score NUMERIC CHECK (correlation_score >= -1 AND correlation_score <= 1),
  category_affected TEXT, -- 'skin', 'overall', etc.
  insight_text TEXT NOT NULL,
  data_points JSONB,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wellness_data_user_date ON public.user_wellness_data(user_id, date DESC);
CREATE INDEX idx_wellness_correlations_user ON public.wellness_correlations(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.user_wellness_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_correlations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own wellness data" ON public.user_wellness_data 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own wellness data" ON public.user_wellness_data 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own wellness data" ON public.user_wellness_data 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users see own correlations" ON public.wellness_correlations 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own correlations" ON public.wellness_correlations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own correlations" ON public.wellness_correlations 
  FOR UPDATE USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE public.user_wellness_data IS 'Wearable and manual wellness data (sleep, hydration, exercise, stress, nutrition)';
COMMENT ON TABLE public.wellness_correlations IS 'Pre-calculated correlations between wellness metrics and aesthetic scores';

