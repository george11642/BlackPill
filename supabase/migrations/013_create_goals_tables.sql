-- Migration: Create goals tables
-- Date: 2025-10-30
-- Description: F13 - Goal Setting & Tracking

CREATE TABLE public.user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('score_improvement', 'category_improvement', 'routine_consistency', 'custom')),
  target_value NUMERIC,
  current_value NUMERIC,
  deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE public.goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.user_goals(id) ON DELETE CASCADE,
  milestone_name TEXT,
  target_value NUMERIC,
  target_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_user_goals_user_status ON public.user_goals(user_id, status);
CREATE INDEX idx_goal_milestones_goal ON public.goal_milestones(goal_id);

-- RLS Policies
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own goals" ON public.user_goals 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own goals" ON public.user_goals 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own goals" ON public.user_goals 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own goals" ON public.user_goals 
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users see milestones for own goals" ON public.goal_milestones 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.user_goals 
    WHERE user_goals.id = goal_milestones.goal_id 
    AND user_goals.user_id = auth.uid()
  ));
CREATE POLICY "Users create milestones for own goals" ON public.goal_milestones 
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_goals 
    WHERE user_goals.id = goal_milestones.goal_id 
    AND user_goals.user_id = auth.uid()
  ));
CREATE POLICY "Users update milestones for own goals" ON public.goal_milestones 
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.user_goals 
    WHERE user_goals.id = goal_milestones.goal_id 
    AND user_goals.user_id = auth.uid()
  ));

-- Comments
COMMENT ON TABLE public.user_goals IS 'User-defined improvement goals';
COMMENT ON TABLE public.goal_milestones IS 'Milestones for tracking goal progress';

