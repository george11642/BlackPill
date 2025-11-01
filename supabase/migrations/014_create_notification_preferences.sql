-- Migration: Create notification preferences table
-- Date: 2025-10-30
-- Description: F14 - Enhanced Push Notification System

CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  routine_reminders BOOLEAN DEFAULT true,
  streak_reminders BOOLEAN DEFAULT true,
  goal_updates BOOLEAN DEFAULT true,
  social_notifications BOOLEAN DEFAULT true,
  marketing_notifications BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notification_preferences_user ON public.notification_preferences(user_id);

-- RLS Policies
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own preferences" ON public.notification_preferences 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own preferences" ON public.notification_preferences 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own preferences" ON public.notification_preferences 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.notification_preferences IS 'User notification preferences and quiet hours';

