-- Migration: Create personalized insights table
-- Date: 2025-10-30
-- Description: F16 - Personalized Insights Dashboard

-- User insights (AI-generated)
CREATE TABLE public.user_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('correlation', 'timing', 'prediction', 'comparative')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data_points JSONB, -- Supporting data for the insight
  actionable_recommendation TEXT,
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
  is_viewed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Insights can expire after being outdated
);

-- Indexes
CREATE INDEX idx_insights_user ON public.user_insights(user_id, created_at DESC);
CREATE INDEX idx_insights_type ON public.user_insights(insight_type);
CREATE INDEX idx_insights_unviewed ON public.user_insights(user_id, is_viewed) WHERE is_viewed = false;

-- RLS Policies
ALTER TABLE public.user_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own insights" ON public.user_insights 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own insights" ON public.user_insights 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own insights" ON public.user_insights 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE public.user_insights IS 'AI-generated personalized insights based on user data patterns';

