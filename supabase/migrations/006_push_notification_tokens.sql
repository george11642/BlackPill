-- Push notification tokens table
-- Stores FCM tokens for sending push notifications to users

CREATE TABLE IF NOT EXISTS public.user_device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web', 'unknown')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Index for faster lookups
CREATE INDEX idx_user_device_tokens_user_id ON public.user_device_tokens(user_id);
CREATE INDEX idx_user_device_tokens_token ON public.user_device_tokens(token);

-- Updated_at trigger
CREATE TRIGGER update_user_device_tokens_updated_at
  BEFORE UPDATE ON public.user_device_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policy: Users can only see their own tokens
CREATE POLICY "user_device_tokens_select_own" ON public.user_device_tokens FOR SELECT
  USING (auth.uid() = user_id);

