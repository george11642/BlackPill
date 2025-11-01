-- Migration: Create routines system tables
-- Date: 2025-10-30
-- Description: F7 - Custom Routines System with task tracking, streaks, and analytics

-- Routines table
CREATE TABLE public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  focus_categories TEXT[], -- ['skin', 'jawline', 'overall']
  is_active BOOLEAN DEFAULT true,
  created_from_analysis_id UUID REFERENCES public.analyses(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine tasks
CREATE TABLE public.routine_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'skincare', 'grooming', 'fitness', 'nutrition', 'mewing'
  time_of_day TEXT[], -- ['morning', 'evening']
  frequency TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly'
  specific_days INT[], -- [1,3,5] for Mon/Wed/Fri, NULL for daily
  order_index INT NOT NULL DEFAULT 0,
  is_timed BOOLEAN DEFAULT false,
  duration_minutes INT,
  product_name TEXT,
  product_link TEXT,
  why_it_helps TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Completion tracking
CREATE TABLE public.routine_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.routine_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  skipped BOOLEAN DEFAULT false,
  notes TEXT
);

-- Streak tracking
CREATE TABLE public.routine_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_completed_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(routine_id, user_id)
);

-- Indexes
CREATE INDEX idx_routines_user_active ON public.routines(user_id, is_active);
CREATE INDEX idx_routine_tasks_routine ON public.routine_tasks(routine_id, order_index);
CREATE INDEX idx_routine_completions_user_date ON public.routine_completions(user_id, completed_at);
CREATE INDEX idx_routine_completions_task ON public.routine_completions(task_id);
CREATE INDEX idx_routine_streaks_user ON public.routine_streaks(user_id);

-- RLS Policies
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own routines" ON public.routines 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own routines" ON public.routines 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own routines" ON public.routines 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own routines" ON public.routines 
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users see tasks for own routines" ON public.routine_tasks 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.routines 
    WHERE routines.id = routine_tasks.routine_id 
    AND routines.user_id = auth.uid()
  ));

CREATE POLICY "Users see own completions" ON public.routine_completions 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own completions" ON public.routine_completions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users see own streaks" ON public.routine_streaks 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own streaks" ON public.routine_streaks 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own streaks" ON public.routine_streaks 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE public.routines IS 'User-created custom improvement routines';
COMMENT ON TABLE public.routine_tasks IS 'Individual tasks within a routine';
COMMENT ON TABLE public.routine_completions IS 'Tracks task completion history';
COMMENT ON TABLE public.routine_streaks IS 'Tracks daily completion streaks per routine';

