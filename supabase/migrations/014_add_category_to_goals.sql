-- Migration: Add category column to user_goals table
-- Date: 2025-11-30
-- Description: Add category column to track which category a goal belongs to

ALTER TABLE public.user_goals 
ADD COLUMN category TEXT CHECK (category IN ('score', 'skin', 'jawline', 'masculinity', 'cheekbones', 'eyes', 'symmetry', 'lips', 'hair', 'routine', NULL));

-- Create index for finding category goals
CREATE INDEX idx_user_goals_category ON public.user_goals(user_id, category) WHERE category IS NOT NULL;

