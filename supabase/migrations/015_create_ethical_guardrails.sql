-- Migration: Create ethical guardrails and wellness checks tables
-- Date: 2025-10-30
-- Description: F20 - Ethical Guardrails & Mental Health Resources

-- User ethical settings
CREATE TABLE public.user_ethical_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  age_estimation BOOLEAN DEFAULT true,
  ethnicity_detection BOOLEAN DEFAULT false,
  body_type_inferences BOOLEAN DEFAULT true,
  advanced_features BOOLEAN DEFAULT true,
  disclaimers_acknowledged BOOLEAN DEFAULT false,
  enable_wellness_checks BOOLEAN DEFAULT true,
  check_frequency TEXT DEFAULT 'weekly' CHECK (check_frequency IN ('weekly', 'biweekly', 'monthly')),
  show_resources_on_low_scores BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wellness checks tracking
CREATE TABLE public.wellness_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  trigger_reason TEXT NOT NULL, -- 'frequent_scans', 'low_score', 'streak_broken', 'manual'
  message_shown TEXT NOT NULL,
  resources_accessed BOOLEAN DEFAULT false,
  user_response TEXT CHECK (user_response IN ('dismissed', 'viewed_resources', 'contacted_support')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ethical_settings_user ON public.user_ethical_settings(user_id);
CREATE INDEX idx_wellness_checks_user ON public.wellness_checks(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.user_ethical_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own ethical settings" ON public.user_ethical_settings 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own ethical settings" ON public.user_ethical_settings 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ethical settings" ON public.user_ethical_settings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users see own wellness checks" ON public.wellness_checks 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own wellness checks" ON public.wellness_checks 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own wellness checks" ON public.wellness_checks 
  FOR UPDATE USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE public.user_ethical_settings IS 'User preferences for sensitive inferences and wellness features';
COMMENT ON TABLE public.wellness_checks IS 'Tracks wellness check interventions and user responses';

