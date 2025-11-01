-- Migration: Create AI coach tables
-- Date: 2025-10-30
-- Description: F12 - AI Chat Coach

CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tokens_used INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ai_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  messages_sent INT DEFAULT 0,
  tokens_used INT DEFAULT 0,
  UNIQUE(user_id, month)
);

-- Indexes
CREATE INDEX idx_ai_conversations_user ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_messages_conversation ON public.ai_messages(conversation_id, created_at);
CREATE INDEX idx_ai_usage_tracking_user_month ON public.ai_usage_tracking(user_id, month DESC);

-- RLS Policies
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own conversations" ON public.ai_conversations 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own conversations" ON public.ai_conversations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own conversations" ON public.ai_conversations 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own conversations" ON public.ai_conversations 
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users see messages in own conversations" ON public.ai_messages 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.ai_conversations 
    WHERE ai_conversations.id = ai_messages.conversation_id 
    AND ai_conversations.user_id = auth.uid()
  ));
CREATE POLICY "Users create messages in own conversations" ON public.ai_messages 
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.ai_conversations 
    WHERE ai_conversations.id = ai_messages.conversation_id 
    AND ai_conversations.user_id = auth.uid()
  ));

CREATE POLICY "Users see own usage tracking" ON public.ai_usage_tracking 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own usage tracking" ON public.ai_usage_tracking 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own usage tracking" ON public.ai_usage_tracking 
  FOR UPDATE USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.ai_conversations IS 'AI coach conversation threads';
COMMENT ON TABLE public.ai_messages IS 'Individual messages in AI conversations';
COMMENT ON TABLE public.ai_usage_tracking IS 'Tracks AI usage per user per month for rate limiting';

